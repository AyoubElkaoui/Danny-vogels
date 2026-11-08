// Wat is er de laatste dagen in de buurt gezien? Haalt vogelwaarnemingen op bij waarneming.nl
// (openbare API, geen CORS) en vat ze samen per soort.
import { getUser, send } from './_lib.js';

const API = 'https://waarneming.nl/api/v1/observations/around-point/';
const PAGE = 500;
const MAX_PAGES = 6;
const cache = new Map();

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

async function page(params, offset) {
  const url = `${API}?${new URLSearchParams({ ...params, limit: PAGE, offset })}`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'nl', 'User-Agent': 'danny-vogels/1.0 (persoonlijk vogelboekje)' } });
  if (!r.ok) throw new Error(`waarneming.nl ${r.status}`);
  return r.json();
}

export default async function handler(req, res) {
  const demo = new URL(req.url, 'http://x').searchParams.get('demo') === '1';
  if (!demo && !(await getUser(req))) return send(res, 401, { error: 'Niet ingelogd' });
  const q = new URL(req.url, 'http://x').searchParams;
  // demo zonder inlog: alleen vaste plek (Hilversum), zodat dit geen open doorgeefluik wordt
  const lat = demo ? 52.2292 : Number(q.get('lat')), lng = demo ? 5.1669 : Number(q.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return send(res, 400, { error: 'Locatie ontbreekt' });
  const days = clamp(Math.round(Number(q.get('days')) || 7), 1, 14);
  const radius = clamp(Math.round(Number(q.get('radius')) || 5000), 500, 10000);
  const params = { lat: lat.toFixed(4), lng: lng.toFixed(4), days, radius, species_group: 1 };
  const key = JSON.stringify(params);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return send(res, 200, hit.body, 'private, max-age=600');

  try {
    const first = await page(params, 0);
    const pages = Math.min(MAX_PAGES, Math.ceil(first.count / PAGE));
    const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => page(params, (i + 1) * PAGE).catch(() => ({ results: [] }))));
    const obs = [first, ...rest].flatMap(p => p.results || []);

    const by = new Map();
    for (const o of obs) {
      const s = o.species_detail;
      if (!s || s.type !== 'S' || o.is_escape) continue;
      let e = by.get(s.id);
      if (!e) {
        e = { id: s.id, sci: s.scientific_name, name: s.name, obs: 0, total: 0, last: '', rarity: 0, places: {}, photo: false, url: `https://waarneming.nl/species/${s.id}/`, lastUrl: '' };
        by.set(s.id, e);
      }
      e.obs++;
      e.total += Number(o.number) || 1;
      e.rarity = Math.max(e.rarity, Number(o.rarity) || 0);
      e.photo ||= !!o.has_photo;
      const when = `${o.date} ${o.time || ''}`.trim();
      if (when > e.last) { e.last = when; e.lastUrl = o.permalink; }
      const place = o.location_detail?.name;
      if (place) e.places[place] = (e.places[place] || 0) + 1;
    }
    const species = [...by.values()].map(e => ({
      ...e,
      places: Object.entries(e.places).sort((a, b) => b[1] - a[1]).slice(0, 3).map(p => p[0]),
    })).sort((a, b) => b.obs - a.obs);

    const body = { days, radius, count: first.count, used: obs.length, species, fetched: new Date().toISOString() };
    cache.set(key, { t: Date.now(), body });
    if (cache.size > 50) cache.delete(cache.keys().next().value);
    return send(res, 200, body, 'private, max-age=600');
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'waarneming.nl is nu niet bereikbaar' });
  }
}
