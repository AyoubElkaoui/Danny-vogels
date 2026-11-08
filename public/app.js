/* Danny's Vogels — persoonlijk vogelboekje
   Soortnamen: IOC World Bird List 15.2 (Nederlandse namen) — public/species.json
   Foto's: iNaturalist · In de buurt: waarneming.nl (via /api/nearby) · Locatie: OpenStreetMap */
'use strict';

const DEMO = new URLSearchParams(location.search).has('demo');
// vanaf het beginscherm altijd de echte versie, ook als het icoon op de demo-pagina is aangemaakt
if (DEMO && (navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches))) location.replace('/');
const LS_CACHE = DEMO ? 'dv_demo' : 'dv_cache';
const HOME_DEFAULT = { name: 'Hilversum', country: 'NL', lat: 52.2292, lng: 5.1669 };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
const todayStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nowTime = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-'’.]/g, ' ').replace(/\s+/g, ' ').trim();
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* vol of privé-modus */ } };

const BIRD_SVG = '<svg viewBox="0 0 24 24"><path d="M3 15c3 0 5-1.5 6.5-3.5S12.5 7 15 7c2 0 3.2 1 3.8 2.2L21 9.5l-2 1.3c0 3.5-2.8 6.7-7 6.7-3.4 0-6.4-1-9-2.5Z"/><path d="M10 17.5 9.5 20M13 17.5l.5 2.5"/><circle cx="16.5" cy="9.5" r=".6"/></svg>';
const ICON = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  gps: '<svg viewBox="0 0 24 24"><path d="m3 11 18-8-8 18-2-8-8-2Z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  photo: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
};

// ---------- kleed & geslacht ----------
const PLUMAGES = ['zomerkleed', 'winterkleed', 'eclipskleed', 'juveniel', 'onvolwassen'];
const SEXES = ['man', 'vrouw', 'paar'];
const VARIANT_WORDS = {
  zomer: { plumage: 'zomerkleed' }, zomerkleed: { plumage: 'zomerkleed' }, broed: { plumage: 'zomerkleed' }, broedkleed: { plumage: 'zomerkleed' }, prachtkleed: { plumage: 'zomerkleed' },
  winter: { plumage: 'winterkleed' }, winterkleed: { plumage: 'winterkleed' },
  eclips: { plumage: 'eclipskleed' }, eclipskleed: { plumage: 'eclipskleed' },
  juv: { plumage: 'juveniel' }, juveniel: { plumage: 'juveniel' }, jong: { plumage: 'juveniel' }, juvenile: { plumage: 'juveniel' },
  onvolwassen: { plumage: 'onvolwassen' }, imm: { plumage: 'onvolwassen' }, immature: { plumage: 'onvolwassen' },
  man: { sex: 'man' }, mannetje: { sex: 'man' }, male: { sex: 'man' },
  vrouw: { sex: 'vrouw' }, vrouwtje: { sex: 'vrouw' }, female: { sex: 'vrouw' },
  paar: { sex: 'paar' }, paartje: { sex: 'paar' },
};
// Soorten met duidelijk zomer- en winterkleed
const SEASONAL = new Set(['Sturnus vulgaris', 'Chroicocephalus ridibundus', 'Ichthyaetus melanocephalus', 'Hydrocoloeus minutus', 'Podiceps cristatus', 'Podiceps nigricollis', 'Podiceps auritus', 'Podiceps grisegena', 'Tachybaptus ruficollis', 'Gavia stellata', 'Gavia arctica', 'Gavia immer', 'Calidris alpina', 'Calidris canutus', 'Calidris alba', 'Calidris ferruginea', 'Calidris minuta', 'Calidris pugnax', 'Calidris maritima', 'Limosa lapponica', 'Limosa limosa', 'Pluvialis apricaria', 'Pluvialis squatarola', 'Tringa erythropus', 'Arenaria interpres', 'Eudromias morinellus', 'Sterna hirundo', 'Sterna paradisaea', 'Thalasseus sandvicensis', 'Sternula albifrons', 'Chlidonias niger', 'Chlidonias hybrida', 'Chlidonias leucopterus', 'Uria aalge', 'Alca torda', 'Fratercula arctica', 'Cepphus grylle', 'Clangula hyemalis', 'Phalaropus lobatus', 'Phalaropus fulicarius', 'Anthus spinoletta', 'Anthus petrosus', 'Plectrophenax nivalis', 'Calcarius lapponicus', 'Fringilla montifringilla', 'Ardea ibis', 'Egretta garzetta', 'Haematopus ostralegus', 'Charadrius hiaticula', 'Tringa totanus', 'Gallinago gallinago', 'Emberiza schoeniclus']);
// Eenden: man, vrouw en eclipskleed
const DUCKS = new Set(['Anas platyrhynchos', 'Mareca strepera', 'Spatula clypeata', 'Anas crecca', 'Mareca penelope', 'Anas acuta', 'Aythya fuligula', 'Aythya ferina', 'Aythya marila', 'Aythya nyroca', 'Bucephala clangula', 'Mergellus albellus', 'Mergus merganser', 'Mergus serrator', 'Aix galericulata', 'Aix sponsa', 'Somateria mollissima', 'Spatula querquedula', 'Netta rufina', 'Melanitta nigra', 'Melanitta fusca']);
// Duidelijk verschil tussen man en vrouw
const DIMORPHIC = new Set(['Fringilla coelebs', 'Pyrrhula pyrrhula', 'Phoenicurus ochruros', 'Phoenicurus phoenicurus', 'Sylvia atricapilla', 'Turdus merula', 'Phasianus colchicus', 'Circus aeruginosus', 'Circus cyaneus', 'Circus pygargus', 'Falco tinnunculus', 'Accipiter nisus', 'Passer domesticus', 'Saxicola rubicola', 'Oenanthe oenanthe', 'Motacilla flava', 'Emberiza citrinella', 'Linaria cannabina', 'Spinus spinus', 'Lanius collurio', 'Ficedula hypoleuca', 'Luscinia svecica', 'Dendrocopos major', 'Dryobates minor', 'Picus viridis', 'Loxia curvirostra', 'Carpodacus erythrinus', 'Oriolus oriolus', 'Cygnus olor', 'Tetrao urogallus', 'Lyrurus tetrix', 'Pavo cristatus', 'Chrysolophus pictus']);

const variantLabel = (v = {}) => [v.sex, v.plumage].filter(Boolean).join(', ');

// ---------- landen ----------
const ISO = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW'.split(' ');
let regionNames;
try { regionNames = new Intl.DisplayNames(['nl'], { type: 'region' }); } catch { regionNames = null; }
const countryName = c => (c && regionNames ? (regionNames.of(c) || c) : (c || ''));
const flag = c => (c && c.length === 2 ? String.fromCodePoint(...[...c.toUpperCase()].map(ch => 0x1F1A5 + ch.charCodeAt(0))) : '');
const COUNTRIES = ISO.map(c => [c, countryName(c)]).sort((a, b) => a[1].localeCompare(b[1], 'nl'));

// ---------- datums ----------
const fmtDay = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
const dateObj = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
function shortDay(s) {
  const l = dayLabel(s);
  return l === 'Vandaag' || l === 'Gisteren' ? l.toLowerCase() : new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(dateObj(s));
}
function dayLabel(s) {
  const t = todayStr();
  const y = todayStr(new Date(Date.now() - 864e5));
  if (s === t) return 'Vandaag';
  if (s === y) return 'Gisteren';
  return fmtDay.format(dateObj(s));
}

// ---------- staat & opslag ----------
let state = fresh();
let user = null;
let dirty = false;
let saveTimer = null;
let tab = lsGet('dv_tab', 'boek');

function fresh() { return { v: 1, sightings: [], settings: { home: { ...HOME_DEFAULT } } }; }
function normalizeState(d) {
  const s = { ...fresh(), ...(d || {}) };
  s.sightings = Array.isArray(s.sightings) ? s.sightings : [];
  s.settings = { ...fresh().settings, ...(s.settings || {}) };
  delete s._savedAt;
  return s;
}

function setSync(cls, title) { const el = $('#sync'); el.className = 'savestate ' + (cls || ''); el.textContent = DEMO ? '' : (title || ''); }

function commit() {
  dirty = true;
  lsSet(LS_CACHE, { state, dirty, user });
  render();
  if (DEMO) { dirty = false; setSync(); return; }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(push, 500);
}

async function push() {
  if (DEMO || !dirty) return;
  setSync('busy', 'Opslaan…');
  try {
    const r = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: state }) });
    if (r.status === 401) { showLogin(); return; }
    if (!r.ok) throw new Error(r.status);
    dirty = false;
    lsSet(LS_CACHE, { state, dirty, user });
    setSync('', 'Opgeslagen');
  } catch {
    setSync('err', 'Niet opgeslagen — probeert het zo opnieuw');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(push, 8000);
  }
}
addEventListener('online', () => dirty && push());
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dirty) push(); });

// ---------- soortenlijst ----------
let SP = null;
let spPromise = null;
function loadSpecies() {
  spPromise ||= fetch('species.json?v=ioc152b').then(r => r.json()).then(d => {
    const list = d.s.map((a, i) => {
      const k = norm(a[0]);
      return { nl: a[0], en: a[1], sci: a[2], fam: d.f[a[3]], pop: a[4], ph: a[5], i, k, kc: k.replace(/ /g, ''), ke: norm(a[1]), ks: norm(a[2]) };
    });
    SP = { list, bySci: new Map(list.map(s => [s.sci, s])) };
    return SP;
  });
  return spPromise;
}
const spBySci = sci => SP?.bySci.get(sci);

function seenMap() {
  const m = new Map();
  for (const s of state.sightings) m.set(s.sci, (m.get(s.sci) || 0) + 1);
  return m;
}

function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

const wordStart = (str, q) => (' ' + str).includes(' ' + q);

function searchSpecies(input) {
  const words = norm(input).split(' ').filter(Boolean);
  let hint = {};
  let rest = words;
  if (words.length > 1) {
    rest = [];
    for (const w of words) { if (VARIANT_WORDS[w]) Object.assign(hint, VARIANT_WORDS[w]); else rest.push(w); }
    if (!rest.length) { rest = words; hint = {}; }
  }
  const q = rest.join(' ');
  if (!SP || q.length < 2) return { hint, res: [] };
  const qc = q.replace(/ /g, '');
  const seen = seenMap();
  const out = [];
  for (const s of SP.list) {
    let m = 0;
    if (s.k === q) m = 1000;
    else if (s.k.startsWith(q)) m = 800;
    else if (s.kc.startsWith(qc)) m = 780;
    else if (wordStart(s.k, q)) m = 640;
    else if (q.length > 2 && s.kc.endsWith(qc)) m = 620;   // samenstelling: koolMEES, pimpelMEES
    else if (q.length > 2 && s.kc.includes(qc)) m = 430;
    if (s.ke === q) m = Math.max(m, 720);
    else if (s.ke.startsWith(q)) m = Math.max(m, 520);
    else if (wordStart(s.ke, q)) m = Math.max(m, 400);
    if (s.ks === q) m = Math.max(m, 900);
    else if (s.ks.startsWith(q)) m = Math.max(m, 560);
    else if (wordStart(s.ks, q)) m = Math.max(m, 430);
    if (!m) continue;
    out.push([m + s.pop * 5 + (seen.has(s.sci) ? 260 : 0), s]);
  }
  if (out.length < 4 && q.length >= 4) {
    const max = q.length >= 5 ? 2 : 1;
    const have = new Set(out.map(x => x[1]));
    for (const s of SP.list) {
      if (have.has(s)) continue;
      const d = Math.min(lev(qc, s.kc.slice(0, qc.length), max), lev(qc, s.kc, max));
      if (d <= max) out.push([300 - d * 80 + s.pop * 5 + (seen.has(s.sci) ? 260 : 0), s]);
    }
  }
  out.sort((a, b) => b[0] - a[0]);
  return { hint, res: out.slice(0, 8).map(x => x[1]) };
}

function variantsFor(s, hint) {
  const rows = [];
  const same = (a, b) => (a.sex || '') === (b.sex || '') && (a.plumage || '') === (b.plumage || '');
  if (hint.plumage || hint.sex) rows.push(hint);
  const set = SEASONAL.has(s.sci) ? [{ plumage: 'zomerkleed' }, { plumage: 'winterkleed' }, { plumage: 'juveniel' }]
    : DUCKS.has(s.sci) ? [{ sex: 'man' }, { sex: 'vrouw' }, { sex: 'man', plumage: 'eclipskleed' }]
      : DIMORPHIC.has(s.sci) ? [{ sex: 'man' }, { sex: 'vrouw' }] : [];
  for (const v of set) if (!rows.some(r => same(r, v))) rows.push(v);
  return rows;
}

// ---------- foto's (iNaturalist) ----------
const photoUrl = (code, size = 'medium') => {
  if (!code) return '';
  const m = code.match(/^([os])(\d+)\.(\w+)$/);
  if (!m) return '';
  return m[1] === 'o' ? `https://inaturalist-open-data.s3.amazonaws.com/photos/${m[2]}/${size}.${m[3]}` : `https://static.inaturalist.org/photos/${m[2]}/${size}.${m[3]}`;
};
const sized = (url, size) => (url || '').replace(/\/(square|small|medium|large|original)\.(jpe?g|png)/i, `/${size}.$2`);
const imgCache = lsGet('dv_img', {});
const saveImgCache = () => lsSet('dv_img', imgCache);
const INAT = 'https://api.inaturalist.org/v1';

async function speciesPhoto(s) {
  if (s.ph) return { url: photoUrl(s.ph, 'medium'), credit: 'iNaturalist' };
  const key = 't:' + s.sci;
  if (imgCache[key] !== undefined) return imgCache[key];
  try {
    const r = await fetch(`${INAT}/taxa?q=${encodeURIComponent(s.sci)}&rank=species,subspecies&per_page=3`);
    const d = await r.json();
    const t = (d.results || []).find(x => x.name === s.sci) || (d.results || [])[0];
    const p = t?.default_photo;
    imgCache[key] = p ? { url: p.medium_url, credit: p.attribution || 'iNaturalist' } : null;
  } catch { return null; }
  saveImgCache();
  return imgCache[key];
}

function variantQuery(v) {
  const p = {};
  if (v.plumage === 'zomerkleed') p.month = '5,6,7';
  if (v.plumage === 'winterkleed') p.month = '12,1,2';
  if (v.plumage === 'eclipskleed') { p.month = '7,8,9'; }
  if (v.plumage === 'juveniel' || v.plumage === 'onvolwassen') { p.term_id = 1; p.term_value_id = 8; }
  if (v.sex === 'man' || v.plumage === 'eclipskleed') { p.term_id = 9; p.term_value_id = 11; }
  if (v.sex === 'vrouw') { p.term_id = 9; p.term_value_id = 10; }
  if (v.plumage === 'juveniel' && v.sex) { p.term_id = 1; p.term_value_id = 8; } // leeftijd gaat voor
  return p;
}

async function observationPhotos(s, v = {}, n = 12) {
  const vq = variantQuery(v);
  const key = `o:${s.sci}:${JSON.stringify(vq)}:${n}`;
  if (imgCache[key]) return imgCache[key];
  // Europese soorten: foto's uit Europa (minder tamme/kweekvormen en verkeerde determinaties)
  if (SEASONAL.has(s.sci) || DUCKS.has(s.sci) || DIMORPHIC.has(s.sci) || s.pop >= 25) vq.place_id = 97391; // pop >= 25: komt in NL voor
  const params = new URLSearchParams({ taxon_name: s.sci, photos: 'true', quality_grade: 'research', order_by: 'votes', per_page: String(n), ...vq });
  try {
    const r = await fetch(`${INAT}/observations?${params}`);
    const d = await r.json();
    const out = (d.results || []).map(o => o.photos?.[0]).filter(Boolean).map(p => ({ url: sized(p.url, 'medium'), credit: p.attribution || 'iNaturalist' }));
    if (out.length) { imgCache[key] = out; saveImgCache(); }
    return out;
  } catch { return []; }
}

async function bestPhoto(s, v = {}) {
  if (v.plumage || v.sex) {
    const list = await observationPhotos(s, v, 6);
    if (list[0]) return list[0];
  }
  return speciesPhoto(s);
}

// ---------- locatie ----------
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=nl`);
    const d = await r.json();
    const a = d.address || {};
    const town = a.city || a.town || a.village || a.hamlet || a.municipality || a.county || '';
    const spot = a.nature_reserve || a.park || a.leisure || a.water || a.wood || a.suburb || a.neighbourhood || '';
    const place = [spot !== town ? spot : '', town].filter(Boolean).join(', ') || (d.display_name || '').split(',')[0];
    return { place, country: (a.country_code || '').toUpperCase(), lat: +(+lat).toFixed(5), lng: +(+lng).toFixed(5) };
  } catch {
    return { place: '', country: '', lat: +(+lat).toFixed(5), lng: +(+lng).toFixed(5) };
  }
}

async function placeSearch(q, near) {
  const p = new URLSearchParams({ q, limit: '6' });
  if (near) { p.set('lat', near.lat); p.set('lon', near.lng); }
  const r = await fetch(`https://photon.komoot.io/api/?${p}`);
  const d = await r.json();
  return (d.features || []).map(f => {
    const pr = f.properties || {};
    const town = pr.city || pr.town || pr.village || pr.county || '';
    const name = pr.name || town;
    return {
      place: [name, town && town !== name ? town : ''].filter(Boolean).join(', '),
      sub: [pr.state, countryName((pr.countrycode || '').toUpperCase())].filter(Boolean).join(', '),
      country: (pr.countrycode || '').toUpperCase(),
      lat: +f.geometry.coordinates[1].toFixed(5), lng: +f.geometry.coordinates[0].toFixed(5),
    };
  }).filter(x => x.place);
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geen GPS'));
    navigator.geolocation.getCurrentPosition(p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }), reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  });
}

function recentPlaces() {
  const seen = new Map();
  const list = [...state.sightings].sort((a, b) => (b.date + b.time + b.created).localeCompare(a.date + a.time + a.created));
  for (const s of list) {
    if (!s.place) continue;
    const k = norm(s.place) + '|' + s.country;
    if (!seen.has(k)) seen.set(k, { place: s.place, country: s.country, lat: s.lat, lng: s.lng });
    if (seen.size >= 6) break;
  }
  return [...seen.values()];
}

// ---------- toast ----------
let toastTimer;
function toast(msg, action, fn) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { el.classList.remove('show'); fn(); };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 5000 : 2600);
}

// ---------- sheet ----------
let onSheetClose = null;
function openSheet(html, { full = false, onClose } = {}) {
  const sheet = $('#sheet'), panel = $('#sheetPanel');
  panel.className = 'sheet-panel' + (full ? ' full' : '');
  panel.innerHTML = `<div class="grab"></div>${html}`;
  panel.scrollTop = 0;
  sheet.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  onSheetClose = onClose || null;
  return panel;
}
function closeSheet() {
  $('#sheet').classList.add('hidden');
  document.body.style.overflow = '';
  const f = onSheetClose; onSheetClose = null;
  f && f();
}
document.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#sheet').classList.contains('hidden')) closeSheet(); });

// ---------- afleidingen ----------
function sortedSightings() {
  return [...state.sightings].sort((a, b) => (b.date + (b.time || '') + b.created).localeCompare(a.date + (a.time || '') + a.created));
}
function firstSeenIds() {
  const first = new Map();
  for (const s of state.sightings) {
    const k = s.date + (s.time || '99:99') + s.created;
    const cur = first.get(s.sci);
    if (!cur || k < cur.k) first.set(s.sci, { k, id: s.id });
  }
  return new Set([...first.values()].map(x => x.id));
}
function lifeList() {
  const m = new Map();
  for (const s of state.sightings) {
    let e = m.get(s.sci);
    if (!e) { e = { sci: s.sci, name: s.name, n: 0, birds: 0, first: s.date, last: s.date, photo: null, countries: new Set(), lastSighting: s }; m.set(s.sci, e); }
    e.n++; e.birds += Number(s.count) || 1;
    if (s.date < e.first) e.first = s.date;
    if (s.date >= e.last) { e.last = s.date; e.lastSighting = s; }
    if (s.country) e.countries.add(s.country);
    if (!e.photo && s.photo?.url && !s.plumage && !s.sex) e.photo = s.photo.url;
  }
  for (const e of m.values()) if (!e.photo) e.photo = e.lastSighting.photo?.url || '';
  return [...m.values()];
}

// ---------- thema & kop (zelfde gedrag als planner en puzzels) ----------
const COVER = n => `https://www.notion.so/images/page-cover/${n}.jpg`;
const TAB_COVERS = { boek: 'woodcuts_1', soorten: 'woodcuts_2', buurt: 'woodcuts_3', kaart: 'woodcuts_5' };
function applyTheme() {
  const pref = state.settings?.theme || 'auto';
  const h = new Date().getHours();
  const light = pref === 'light' || (pref === 'auto' && h >= 7 && h < 19);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  $('#themeBtn').textContent = { auto: 'Automatisch', light: 'Licht', dark: 'Donker' }[pref];
  document.querySelector('meta[name=theme-color]').content = light ? '#f3eee3' : '#141312';
}
function renderHead() {
  $('#todayLabel').textContent = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()) + (DEMO ? ' · demo' : '');
  $('#cover').style.setProperty('--cover', `url(${COVER(TAB_COVERS[tab] || 'woodcuts_1')})`);
  const cs = $('#coverScene');
  if (tab === 'boek') { if (!cs.firstChild) cs.innerHTML = coverScene(); cs.classList.add('on'); }
  else cs.classList.remove('on');
}

function renderStats() {
  const sp = new Set(state.sightings.map(s => s.sci)).size;
  const cc = new Set(state.sightings.map(s => s.country).filter(Boolean)).size;
  const n = state.sightings.length;
  $('#demoBar').classList.toggle('hidden', !DEMO);
  $('#stats').textContent = n ? `${sp} ${sp === 1 ? 'soort' : 'soorten'} · ${n} ${n === 1 ? 'waarneming' : 'waarnemingen'} · ${cc} ${cc === 1 ? 'land' : 'landen'}` : 'Je vogelboekje is nog leeg';
}

const thumbHtml = (url, cls = 'thumb') => url
  ? `<img class="${cls}" src="${esc(sized(url, 'small'))}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'${cls} ph',innerHTML:'${BIRD_SVG.replace(/"/g, '&quot;')}'}))">`
  : `<div class="${cls} ph">${BIRD_SVG}</div>`;

// ---------- weergaven ----------
let boekQuery = '';
function render() {
  renderHead();
  renderStats();
  $$('#tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const v = $('#view');
  if (tab === 'boek') renderBoek(v);
  else if (tab === 'soorten') renderSoorten(v);
  else if (tab === 'buurt') renderBuurt(v);
  else if (tab === 'kaart') renderKaart(v);
}

function emptyHtml(title, text) {
  return `<div class="empty"><img src="icon.svg" alt=""><h3>${esc(title)}</h3><p>${text}</p><button class="btn primary" data-add>${ICON.plus} Eerste vogel toevoegen</button></div>`;
}

function renderBoek(v) {
  if (!state.sightings.length) { v.innerHTML = emptyHtml('Nog leeg', 'Tik op de + en typ een vogel, bijvoorbeeld <b>spreeuw</b>. De foto, datum en plek komen er vanzelf bij.'); return; }
  const had = document.activeElement?.id === 'boekSearch';
  const q = norm(boekQuery);
  const lifers = firstSeenIds();
  const list = sortedSightings().filter(s => !q || norm(`${s.name} ${s.sci} ${s.place} ${countryName(s.country)} ${s.plumage || ''} ${s.sex || ''} ${s.note || ''}`).includes(q));
  const groups = [];
  for (const s of list) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== s.date) { g = { date: s.date, items: [] }; groups.push(g); }
    g.items.push(s);
  }
  v.innerHTML = `
    <div class="search-row">${ICON.search}<input class="input" id="boekSearch" type="search" placeholder="Zoek in je boekje" value="${esc(boekQuery)}"></div>
    ${groups.map(g => {
      const places = [...new Set(g.items.map(s => s.place).filter(Boolean))];
      return `<div class="day"><h3>${esc(dayLabel(g.date))}</h3><span>${esc(places.slice(0, 2).join(' · '))}${places.length > 2 ? ' …' : ''}</span></div>
        ${g.items.map(s => cardHtml(s, lifers.has(s.id))).join('')}`;
    }).join('') || `<p class="muted" style="text-align:center;margin-top:30px">Niets gevonden voor “${esc(boekQuery)}”.</p>`}`;
  const inp = $('#boekSearch');
  inp.oninput = () => { boekQuery = inp.value; renderBoek(v); };
  if (had) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}

function cardHtml(s, lifer) {
  const vl = variantLabel(s);
  const meta = [s.time, s.place, s.country && s.country !== 'NL' ? `${flag(s.country)} ${countryName(s.country)}` : flag(s.country)].filter(Boolean).join(' · ');
  return `<button class="card" data-open="${esc(s.id)}">
    ${thumbHtml(s.photo?.url)}
    <div class="body">
      <div class="name">${esc(s.name)} ${lifer ? '<span class="badge new">Nieuw</span>' : ''}</div>
      ${vl ? `<span class="badge var">${esc(vl)}</span>` : ''}
      <div class="meta">${esc(meta)}</div>
    </div>
    ${Number(s.count) > 1 ? `<div class="count">×${esc(s.count)}</div>` : ''}
  </button>`;
}

let soortSort = lsGet('dv_sort', 'recent');
let soortCountry = '';
function renderSoorten(v) {
  if (!state.sightings.length) { v.innerHTML = emptyHtml('Je soortenlijst', 'Hier komt elke vogel die je ooit hebt gezien, met hoe vaak en waar.'); return; }
  const all = lifeList();
  const year = String(new Date().getFullYear());
  const thisYear = new Set(state.sightings.filter(s => s.date.startsWith(year)).map(s => s.sci)).size;
  const countries = {};
  for (const e of all) for (const c of e.countries) countries[c] = (countries[c] || 0) + 1;
  let list = soortCountry ? all.filter(e => e.countries.has(soortCountry)) : all;
  const cmp = {
    recent: (a, b) => b.last.localeCompare(a.last),
    naam: (a, b) => a.name.localeCompare(b.name, 'nl'),
    vaak: (a, b) => b.n - a.n || a.name.localeCompare(b.name, 'nl'),
    eerst: (a, b) => b.first.localeCompare(a.first),
    systematiek: (a, b) => (spBySci(a.sci)?.i ?? 1e6) - (spBySci(b.sci)?.i ?? 1e6),
  }[soortSort] || ((a, b) => 0);
  list = [...list].sort(cmp);
  v.innerHTML = `
    <div class="kpis">
      <div class="kpi"><b>${all.length}</b><span>soorten totaal</span></div>
      <div class="kpi"><b>${thisYear}</b><span>soorten in ${year}</span></div>
      <div class="kpi"><b>${Object.keys(countries).length}</b><span>${Object.keys(countries).length === 1 ? 'land' : 'landen'}</span></div>
    </div>
    ${Object.keys(countries).length > 1 ? `<div class="chips scroll" id="countryChips">
      <button class="chip ${soortCountry ? '' : 'on'}" data-c="">Overal</button>
      ${Object.entries(countries).sort((a, b) => b[1] - a[1]).map(([c, n]) => `<button class="chip ${soortCountry === c ? 'on' : ''}" data-c="${c}">${flag(c)} ${esc(countryName(c))} · ${n}</button>`).join('')}
    </div>` : ''}
    <div class="sort-row"><b>${list.length} ${list.length === 1 ? 'soort' : 'soorten'}</b>
      <select class="input" id="sortSel">
        ${[['recent', 'Laatst gezien'], ['eerst', 'Nieuwste soorten'], ['vaak', 'Vaakst gezien'], ['naam', 'Naam A–Z'], ['systematiek', 'Vogelgids-volgorde']].map(([k, l]) => `<option value="${k}" ${soortSort === k ? 'selected' : ''}>${l}</option>`).join('')}
      </select></div>
    ${list.map(e => `<button class="card" data-species="${esc(e.sci)}">
      ${thumbHtml(e.photo)}
      <div class="body"><div class="name">${esc(e.name)}</div>
        <div class="meta"><span class="sci">${esc(e.sci)}</span></div>
        <div class="meta">${e.n}× gezien · laatst ${esc(fmtShort.format(dateObj(e.last)))} ${[...e.countries].map(flag).join(' ')}</div></div>
    </button>`).join('')}`;
  $('#sortSel').onchange = e => { soortSort = e.target.value; lsSet('dv_sort', soortSort); renderSoorten(v); };
  $$('#countryChips .chip').forEach(b => b.onclick = () => { soortCountry = b.dataset.c; renderSoorten(v); });
}

// ---------- in de buurt ----------
let near = { days: lsGet('dv_ndays', 7), radius: lsGet('dv_nrad', 5000), onlyNew: false, where: null, data: null, loading: false, err: '', key: '' };
function renderBuurt(v) {
  const where = near.where || state.settings.home || HOME_DEFAULT;
  const seen = seenMap();
  const d = near.data;
  let list = d?.species || [];
  if (near.onlyNew) list = list.filter(s => !seen.has(s.sci));
  const nNew = (d?.species || []).filter(s => !seen.has(s.sci)).length;
  v.innerHTML = `
    <div class="near-head">
      <div class="where"><div><div class="muted" style="font-size:13px">Rond</div><b>${esc(where.name)}</b></div>
        <button class="btn small ghost" id="nearGps">${ICON.gps} Waar ik nu ben</button></div>
      <div><label>Periode</label><div class="chips" id="nDays">${[[1, 'Vandaag'], [3, '3 dagen'], [7, 'Week'], [14, '2 weken']].map(([n, l]) => `<button class="chip ${near.days === n ? 'on' : ''}" data-v="${n}">${l}</button>`).join('')}</div></div>
      <div><label>Afstand</label><div class="chips" id="nRad">${[[2000, '2 km'], [5000, '5 km'], [10000, '10 km']].map(([n, l]) => `<button class="chip ${near.radius === n ? 'on' : ''}" data-v="${n}">${l}</button>`).join('')}</div></div>
    </div>
    ${near.loading ? '<div class="spinner"></div><p class="muted" style="text-align:center">Waarnemingen ophalen bij waarneming.nl…</p>'
      : near.err ? `<div class="empty"><h3>Lukt even niet</h3><p>${esc(near.err)}</p><button class="btn" id="nearRetry">Opnieuw</button></div>`
        : d ? `
      <div class="sort-row"><b>${d.species.length} soorten gezien</b>
        <button class="chip ${near.onlyNew ? 'on' : ''}" id="onlyNew">Nieuw voor mij · ${nNew}</button></div>
      ${list.map(s => {
        const sp = spBySci(s.sci);
        const name = s.name || sp?.nl || s.sci;
        const last = s.last ? s.last.slice(0, 10) : '';
        return `<div class="card" style="cursor:default">
          <a href="${esc(s.url)}" target="_blank" rel="noopener" style="display:contents">${thumbHtml(sp?.ph ? photoUrl(sp.ph, 'small') : '')}</a>
          <div class="body">
            <div class="name">${esc(name)} ${!seen.has(s.sci) ? '<span class="badge new">Nieuw voor jou</span>' : ''} ${s.rarity >= 3 ? '<span class="badge rare">Zeldzaam</span>' : ''}</div>
            <div class="meta">${s.obs} ${s.obs === 1 ? 'melding' : 'meldingen'}${last ? ` · laatst ${esc(shortDay(last))}` : ''}</div>
            <div class="meta">${esc(s.places.join(' · '))}</div>
          </div>
          <button class="add-mini" data-near-add="${esc(s.sci)}" aria-label="Toevoegen">${ICON.plus}</button>
        </div>`;
      }).join('') || '<p class="muted" style="text-align:center">Alles wat hier gezien is, heb jij ook al. Sterk!</p>'}
      <p class="source">Bron: <a href="https://waarneming.nl" target="_blank" rel="noopener">waarneming.nl</a>${d.used < d.count ? ` · de ${d.used} meest recente van ${d.count} meldingen` : ` · ${d.count} meldingen`}</p>`
          : ''}`;
  $$('#nDays .chip').forEach(b => b.onclick = () => { near.days = +b.dataset.v; lsSet('dv_ndays', near.days); loadNear(true); });
  $$('#nRad .chip').forEach(b => b.onclick = () => { near.radius = +b.dataset.v; lsSet('dv_nrad', near.radius); loadNear(true); });
  $('#onlyNew') && ($('#onlyNew').onclick = () => { near.onlyNew = !near.onlyNew; renderBuurt(v); });
  $('#nearRetry') && ($('#nearRetry').onclick = () => loadNear(true));
  $('#nearGps').onclick = async () => {
    const b = $('#nearGps'); b.disabled = true; b.textContent = 'Zoeken…';
    try {
      const p = await getPosition();
      const g = await reverseGeocode(p.lat, p.lng);
      near.where = { name: g.place || 'Mijn locatie', lat: p.lat, lng: p.lng };
      loadNear(true);
    } catch { toast('Locatie niet beschikbaar — sta locatie toe in je browser'); renderBuurt(v); }
  };
  $$('[data-near-add]').forEach(b => b.onclick = () => {
    const s = (near.data.species || []).find(x => x.sci === b.dataset.nearAdd);
    const sp = spBySci(s.sci) || { nl: s.name, en: '', sci: s.sci, pop: 0, ph: '' };
    openEditor(null, { species: sp });
  });
  if (!d && !near.loading && !near.err) loadNear();
}

async function loadNear(force) {
  const where = near.where || state.settings.home || HOME_DEFAULT;
  const key = `${where.lat},${where.lng},${near.days},${near.radius}`;
  if (!force && near.key === key && near.data) return;
  near.loading = true; near.err = ''; near.key = key;
  if (tab === 'buurt') renderBuurt($('#view'));
  try {
    await loadSpecies();
    const p = new URLSearchParams({ lat: where.lat, lng: where.lng, days: near.days, radius: near.radius });
    if (DEMO) p.set('demo', '1');
    const r = await fetch(`/api/nearby?${p}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Fout');
    if (near.key !== key) return;
    near.data = d;
  } catch (e) {
    near.err = e.message || 'Geen verbinding';
    near.data = null;
  }
  near.loading = false;
  if (tab === 'buurt') renderBuurt($('#view'));
}

// ---------- kaart ----------
let leafletP = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  leafletP ||= new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = resolve; js.onerror = reject;
    document.head.appendChild(js);
  });
  return leafletP;
}
let map = null;
async function renderKaart(v) {
  const pts = state.sightings.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  v.innerHTML = `<div class="map" id="map"></div>${pts.length ? '' : '<p class="muted" style="text-align:center">Waarnemingen met een locatie komen hier op de kaart.</p>'}`;
  try { await loadLeaflet(); } catch { $('#map').innerHTML = '<p class="muted" style="padding:20px">Kaart kon niet laden.</p>'; return; }
  if (tab !== 'kaart' || !$('#map')) return;
  if (map) { map.remove(); map = null; }
  map = L.map('map', { zoomControl: false, attributionControl: true }).setView([state.settings.home?.lat || 52.23, state.settings.home?.lng || 5.17], 10);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  const groups = new Map();
  for (const s of pts) {
    const k = `${s.lat.toFixed(3)},${s.lng.toFixed(3)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  }
  const color = getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#c8452f';
  const bounds = [];
  for (const items of groups.values()) {
    const s0 = items[0];
    bounds.push([s0.lat, s0.lng]);
    const species = [...new Set(items.map(s => s.name))];
    L.circleMarker([s0.lat, s0.lng], { radius: Math.min(16, 7 + items.length), color: '#fff', weight: 2, fillColor: color, fillOpacity: .9 })
      .addTo(map)
      .bindPopup(`<b>${esc(s0.place || 'Waarneming')}</b><br>${esc(species.slice(0, 8).join(', '))}${species.length > 8 ? ` +${species.length - 8}` : ''}<br><span style="color:#888">${items.length} ${items.length === 1 ? 'waarneming' : 'waarnemingen'}</span>`);
  }
  const fit = () => {
    if (!map) return;
    map.invalidateSize();
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    else if (bounds.length) map.setView(bounds[0], 12);
  };
  fit();
  setTimeout(fit, 200);
}

// ---------- invoeren / bewerken ----------
function openEditor(existing, preset = {}) {
  const last = sortedSightings()[0];
  const recentSameDay = last && last.date === todayStr() && (Date.now() - (last.created_ts || 0)) < 6 * 3600e3;
  const s = existing ? { ...existing } : {
    id: uid(), sci: '', name: '', en: '', plumage: '', sex: '', count: 1,
    date: todayStr(), time: nowTime(),
    place: preset.keepPlace?.place ?? (recentSameDay ? last.place : ''),
    country: preset.keepPlace?.country ?? (recentSameDay ? last.country : ''),
    lat: preset.keepPlace?.lat ?? (recentSameDay ? last.lat : null),
    lng: preset.keepPlace?.lng ?? (recentSameDay ? last.lng : null),
    note: '', photo: null,
  };
  let species = s.sci ? (spBySci(s.sci) || { nl: s.name, en: s.en, sci: s.sci, pop: 0, ph: '' }) : null;
  let photoCustom = !!existing?.photo?.custom;
  let photoSeq = 0;

  const panel = openSheet(`
    <div class="sheet-head"><h2>${existing ? 'Waarneming bewerken' : 'Nieuwe waarneming'}</h2><button class="icon-btn" data-close aria-label="Sluiten">${ICON.close}</button></div>
    <div id="spBlock"></div>
    <div id="formBlock"></div>
  `, { full: true });

  const spBlock = $('#spBlock', panel), formBlock = $('#formBlock', panel);

  function renderSpeciesPicker(initial = '') {
    spBlock.innerHTML = `
      <div class="species-search">
        <div class="search-row" style="margin:0">${ICON.search}<input class="input" id="spInput" placeholder="Welke vogel? bv. spreeuw" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(initial)}"></div>
        <div class="sugs hidden" id="sugs"></div>
      </div>
      <p class="muted" style="font-size:13px;margin:8px 2px 0">Typ Nederlands, Engels of de wetenschappelijke naam. Tip: “spreeuw winter” of “wilde eend vrouw”.</p>`;
    const inp = $('#spInput', spBlock), box = $('#sugs', spBlock);
    let hl = 0, rows = [], lazyT;
    const update = async () => {
      if (!SP) { box.classList.remove('hidden'); box.innerHTML = '<div class="sug"><div class="t"><div class="s">Soortenlijst laden…</div></div></div>'; await loadSpecies(); }
      const { hint, res } = searchSpecies(inp.value);
      const seen = seenMap();
      const hasHint = !!(hint.plumage || hint.sex);
      rows = [];
      res.forEach((sp, i) => {
        rows.push({ sp, v: i === 0 && hasHint ? hint : {} });
        if (i === 0) for (const v of variantsFor(sp, {})) if (variantLabel(v) !== variantLabel(rows[0].v)) rows.push({ sp, v, variant: true });
      });
      hl = 0;
      if (!inp.value.trim()) { box.classList.add('hidden'); return; }
      box.classList.remove('hidden');
      box.innerHTML = rows.length ? rows.map((r, i) => r.variant
        ? `<button class="sug variant" data-i="${i}"><div class="t"><div class="n">${esc(r.sp.nl)} · <em>${esc(variantLabel(r.v))}</em></div></div></button>`
        : `<button class="sug ${i === 0 ? 'hl' : ''}" data-i="${i}">${thumbHtml(r.sp.ph ? photoUrl(r.sp.ph, 'square') : '', 'thumb')}
            <div class="t"><div class="n">${esc(r.sp.nl)}${variantLabel(r.v) ? ` · <em style="font-style:normal;color:var(--moss)">${esc(variantLabel(r.v))}</em>` : ''}</div><div class="s"><span class="sci">${esc(r.sp.sci)}</span>${r.sp.en && r.sp.en !== r.sp.nl ? ` · ${esc(r.sp.en)}` : ''}</div></div>
            ${seen.get(r.sp.sci) ? `<span class="seen-dot">${seen.get(r.sp.sci)}×</span>` : ''}</button>`).join('')
        : '<div class="sug"><div class="t"><div class="s">Geen vogel gevonden — check de spelling</div></div></div>';
      $$('.sug[data-i]', box).forEach(b => b.onclick = () => pick(rows[+b.dataset.i]));
      // foto's ophalen voor soorten zonder ingebouwde foto
      clearTimeout(lazyT);
      lazyT = setTimeout(() => {
        $$('.sug[data-i]:not(.variant)', box).slice(0, 4).forEach(async b => {
          const r = rows[+b.dataset.i];
          if (r.sp.ph || !b.isConnected) return;
          const p = await speciesPhoto(r.sp);
          const ph = b.querySelector('.thumb.ph');
          if (p && ph && b.isConnected) ph.outerHTML = `<img class="thumb" src="${esc(sized(p.url, 'square'))}" alt="">`;
        });
      }, 350);
    };
    inp.oninput = update;
    inp.onkeydown = e => {
      const btns = $$('.sug[data-i]', box);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        hl = (hl + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length;
        btns.forEach((b, i) => b.classList.toggle('hl', i === hl));
      } else if (e.key === 'Enter' && rows[hl]) { e.preventDefault(); pick(rows[hl]); }
    };
    setTimeout(() => inp.focus(), 60);
    if (initial) update();
  }

  function pick(row) {
    species = row.sp;
    s.sci = species.sci; s.name = species.nl; s.en = species.en;
    s.plumage = row.v.plumage || ''; s.sex = row.v.sex || '';
    photoCustom = false;
    renderChosen();
    refreshPhoto();
  }

  function renderChosen() {
    const vl = variantLabel(s);
    spBlock.innerHTML = `
      <div class="hero loading" id="hero">
        <div class="ph-big">${BIRD_SVG}</div>
        <div class="shade"><div class="n">${esc(s.name)}</div><div class="s">${esc(s.sci)}${vl ? ` · ${esc(vl)}` : ''}</div></div>
        <button class="change" id="changePhoto">${ICON.photo} Andere foto</button>
        <button class="reset" id="changeSp">Andere vogel</button>
      </div>
      <div class="picker hidden" id="picker"></div>`;
    $('#changeSp', spBlock).onclick = () => { collect(); species = null; s.sci = ''; s.photo = null; renderSpeciesPicker(''); renderForm(); };
    $('#changePhoto', spBlock).onclick = openPicker;
    showPhoto();
    renderForm();
  }

  function showPhoto() {
    const hero = $('#hero', spBlock);
    if (!hero) return;
    const old = hero.querySelector('img, .ph-big');
    if (s.photo?.url) {
      const img = new Image();
      img.alt = s.name;
      img.onload = () => { hero.classList.remove('loading'); };
      img.onerror = () => { hero.classList.remove('loading'); };
      img.src = sized(s.photo.url, 'medium');
      old.replaceWith(img);
      hero.querySelector('.credit')?.remove();
      hero.insertAdjacentHTML('beforeend', `<div class="credit">${esc(String(s.photo.credit || 'iNaturalist').replace(/, some rights reserved.*$/i, ''))}</div>`);
    }
  }

  async function refreshPhoto() {
    if (!species || photoCustom) return;
    const seq = ++photoSeq;
    $('#hero', spBlock)?.classList.add('loading');
    const p = await bestPhoto(species, s);
    if (seq !== photoSeq) return;
    if (p) s.photo = { url: p.url, credit: p.credit };
    $('#hero', spBlock)?.classList.remove('loading');
    showPhoto();
  }

  async function openPicker() {
    const box = $('#picker', spBlock);
    if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = '<div class="spinner" style="grid-column:1/-1;margin:16px auto"></div>';
    const [base, list] = await Promise.all([speciesPhoto(species), observationPhotos(species, s, 12)]);
    const all = [base, ...list].filter(Boolean).filter((p, i, a) => a.findIndex(x => x.url === p.url) === i);
    if (!all.length) { box.innerHTML = '<p class="muted" style="grid-column:1/-1">Geen foto\'s gevonden.</p>'; return; }
    box.innerHTML = all.map((p, i) => `<button data-p="${i}" class="${s.photo?.url === p.url ? 'on' : ''}"><img src="${esc(sized(p.url, 'small'))}" alt="" loading="lazy"></button>`).join('');
    $$('button', box).forEach(b => b.onclick = () => {
      const p = all[+b.dataset.p];
      s.photo = { url: p.url, credit: p.credit, custom: true };
      photoCustom = true;
      $$('button', box).forEach(x => x.classList.toggle('on', x === b));
      showPhoto();
    });
  }

  function renderForm() {
    if (!species) { formBlock.innerHTML = ''; return; }
    const recents = recentPlaces().filter(p => norm(p.place) !== norm(s.place));
    formBlock.innerHTML = `
      <div class="field"><span class="field-label">Kleed</span>
        <div class="chips" id="plChips"><button class="chip ${!s.plumage ? 'on' : ''}" data-v="">Normaal</button>${PLUMAGES.map(p => `<button class="chip ${s.plumage === p ? 'on' : ''}" data-v="${p}">${p}</button>`).join('')}</div></div>
      <div class="field"><span class="field-label">Geslacht</span>
        <div class="chips" id="sxChips"><button class="chip ${!s.sex ? 'on' : ''}" data-v="">Onbekend</button>${SEXES.map(p => `<button class="chip ${s.sex === p ? 'on' : ''}" data-v="${p}">${p}</button>`).join('')}</div></div>
      <div class="field"><label for="fCount">Aantal</label>
        <div class="stepper"><button type="button" id="cMin">−</button><input id="fCount" type="number" inputmode="numeric" min="1" value="${esc(s.count || 1)}"><button type="button" id="cPlus">+</button></div></div>
      <div class="field"><span class="field-label">Wanneer</span>
        <div class="row"><input class="input" type="date" id="fDate" value="${esc(s.date)}" max="${todayStr()}"><input class="input flex-none" style="width:132px" type="time" id="fTime" value="${esc(s.time || '')}"></div></div>
      <div class="field"><span class="field-label">Waar</span>
        <div class="row loc-box">
          <input class="input" id="fPlace" placeholder="Plek, bv. Hilversumse Meent" autocomplete="off" value="${esc(s.place || '')}">
          <button class="btn gps" type="button" id="fGps" aria-label="Huidige locatie">${ICON.gps}</button>
          <div class="sugs loc-sugs hidden" id="placeSugs"></div>
        </div>
        ${recents.length ? `<div class="chips scroll" style="margin-top:8px" id="recentPlaces">${recents.map((p, i) => `<button class="chip" data-i="${i}">${flag(p.country)} ${esc(p.place)}</button>`).join('')}</div>` : ''}
        <div class="row" style="margin-top:8px">
          <select class="input" id="fCountry"><option value="">Land kiezen…</option>${COUNTRIES.map(([c, n]) => `<option value="${c}" ${s.country === c ? 'selected' : ''}>${flag(c)} ${esc(n)}</option>`).join('')}</select>
        </div>
        ${Number.isFinite(s.lat) ? `<div class="place-now">${ICON.pin} GPS-punt opgeslagen <button class="btn small ghost" id="clearGps" style="margin-left:auto">wissen</button></div>` : ''}
      </div>
      <div class="field"><label for="fNote">Notitie</label><textarea class="input" id="fNote" rows="2" placeholder="Gedrag, geluid, bijzonderheden…">${esc(s.note || '')}</textarea></div>
      <div class="actions">
        <button class="btn primary wide" id="fSave">${existing ? 'Opslaan' : 'Toevoegen aan boekje'}</button>
        ${existing ? '<button class="btn danger wide" id="fDel">Verwijderen</button>' : ''}
      </div>`;

    $$('#plChips .chip', formBlock).forEach(b => b.onclick = () => { s.plumage = b.dataset.v; $$('#plChips .chip', formBlock).forEach(x => x.classList.toggle('on', x === b)); updateHeroText(); refreshPhoto(); });
    $$('#sxChips .chip', formBlock).forEach(b => b.onclick = () => { s.sex = b.dataset.v; $$('#sxChips .chip', formBlock).forEach(x => x.classList.toggle('on', x === b)); updateHeroText(); refreshPhoto(); });
    const cnt = $('#fCount', formBlock);
    $('#cMin', formBlock).onclick = () => { cnt.value = Math.max(1, (parseInt(cnt.value, 10) || 1) - 1); };
    $('#cPlus', formBlock).onclick = () => { cnt.value = (parseInt(cnt.value, 10) || 0) + 1; };

    const placeInp = $('#fPlace', formBlock), placeBox = $('#placeSugs', formBlock);
    let pT, pSeq = 0;
    placeInp.oninput = () => {
      s.place = placeInp.value; s.lat = null; s.lng = null;
      clearTimeout(pT);
      const q = placeInp.value.trim();
      if (q.length < 3) { placeBox.classList.add('hidden'); return; }
      pT = setTimeout(async () => {
        const seq = ++pSeq;
        let res = [];
        try { res = await placeSearch(q, state.settings.home); } catch { /* offline */ }
        if (seq !== pSeq || !placeInp.isConnected) return;
        if (!res.length) { placeBox.classList.add('hidden'); return; }
        placeBox.classList.remove('hidden');
        placeBox.innerHTML = res.map((r, i) => `<button class="sug" data-i="${i}"><div class="t"><div class="n" style="font-size:15px">${flag(r.country)} ${esc(r.place)}</div><div class="s">${esc(r.sub)}</div></div></button>`).join('');
        $$('.sug', placeBox).forEach(b => b.onpointerdown = e => { e.preventDefault(); setPlace(res[+b.dataset.i]); placeBox.classList.add('hidden'); });
      }, 350);
    };
    placeInp.onblur = () => setTimeout(() => placeBox.classList.add('hidden'), 200);
    $$('#recentPlaces .chip', formBlock).forEach(b => b.onclick = () => setPlace(recents[+b.dataset.i]));
    $('#fGps', formBlock).onclick = async () => {
      const b = $('#fGps', formBlock);
      b.disabled = true; b.innerHTML = '<div class="spinner" style="width:18px;height:18px;margin:0;border-width:2px"></div>';
      try {
        const p = await getPosition();
        const g = await reverseGeocode(p.lat, p.lng);
        setPlace({ ...g, place: g.place || 'Mijn locatie' });
      } catch {
        toast('Locatie niet beschikbaar — sta locatie toe of typ de plek');
        b.disabled = false; b.innerHTML = ICON.gps;
      }
    };
    $('#clearGps', formBlock) && ($('#clearGps', formBlock).onclick = () => { s.lat = null; s.lng = null; collect(); renderForm(); });
    $('#fSave', formBlock).onclick = save;
    const del = $('#fDel', formBlock);
    if (del) del.onclick = () => {
      if (!del.classList.contains('armed')) { del.classList.add('armed'); del.textContent = 'Tik nog een keer om te verwijderen'; setTimeout(() => { if (del.isConnected) { del.classList.remove('armed'); del.textContent = 'Verwijderen'; } }, 3500); return; }
      const idx = state.sightings.findIndex(x => x.id === s.id);
      const removed = state.sightings[idx];
      if (idx >= 0) state.sightings.splice(idx, 1);
      closeSheet(); commit();
      toast(`${removed?.name || 'Waarneming'} verwijderd`, 'Ongedaan maken', () => { state.sightings.push(removed); commit(); });
    };
  }

  function updateHeroText() {
    const sEl = $('#hero .shade .s', spBlock);
    if (sEl) { const vl = variantLabel(s); sEl.textContent = s.sci + (vl ? ` · ${vl}` : ''); }
  }

  function setPlace(p) {
    collect();
    s.place = p.place; s.country = p.country || s.country; s.lat = p.lat ?? null; s.lng = p.lng ?? null;
    renderForm();
  }

  function collect() {
    if (!$('#fDate', formBlock)) return;
    s.count = Math.max(1, parseInt($('#fCount', formBlock).value, 10) || 1);
    s.date = $('#fDate', formBlock).value || todayStr();
    s.time = $('#fTime', formBlock).value || '';
    s.place = $('#fPlace', formBlock).value.trim();
    s.country = $('#fCountry', formBlock).value;
    s.note = $('#fNote', formBlock).value.trim();
  }

  function save() {
    collect();
    if (!s.sci) return;
    const now = new Date().toISOString();
    const rec = {
      id: s.id, sci: s.sci, name: s.name, en: s.en || '', plumage: s.plumage || '', sex: s.sex || '', count: s.count,
      date: s.date, time: s.time, place: s.place, country: s.country,
      lat: Number.isFinite(s.lat) ? s.lat : null, lng: Number.isFinite(s.lng) ? s.lng : null,
      note: s.note, photo: s.photo || null,
      created: existing?.created || now, created_ts: existing?.created_ts || Date.now(), updated: now,
    };
    const wasNew = !state.sightings.some(x => x.sci === rec.sci && x.id !== rec.id);
    const idx = state.sightings.findIndex(x => x.id === rec.id);
    if (idx >= 0) state.sightings[idx] = rec; else state.sightings.push(rec);
    if (!existing) { tab = 'boek'; lsSet('dv_tab', tab); boekQuery = ''; }
    closeSheet(); commit();
    if (existing) toast('Opgeslagen');
    if (!existing && wasNew) FX.burst(70);
    if (!existing) toast(wasNew ? `Nieuwe soort! ${rec.name} staat in je boekje` : `${rec.name} toegevoegd`, 'Nog een hier', () => openEditor(null, { keepPlace: { place: rec.place, country: rec.country, lat: rec.lat, lng: rec.lng } }));
  }

  if (species) {
    renderChosen();
    if (!s.photo?.url) refreshPhoto();
  } else if (preset.species) {
    pick({ sp: preset.species, v: {} });
  } else {
    renderSpeciesPicker('');
    renderForm();
  }
}

// ---------- detail ----------
function openDetail(id) {
  const s = state.sightings.find(x => x.id === id);
  if (!s) return;
  const vl = variantLabel(s);
  const firstIds = firstSeenIds();
  const sameSpecies = state.sightings.filter(x => x.sci === s.sci).length;
  const panel = openSheet(`
    <div class="sheet-head"><h2>${esc(s.name)}</h2><button class="icon-btn" data-close aria-label="Sluiten">${ICON.close}</button></div>
    <div class="hero">${s.photo?.url ? `<img src="${esc(sized(s.photo.url, 'large'))}" alt="" onerror="this.src='${esc(sized(s.photo.url, 'medium'))}'">` : `<div class="ph-big">${BIRD_SVG}</div>`}
      <div class="shade"><div class="n">${esc(s.name)}</div><div class="s">${esc(s.sci)}${vl ? ` · ${esc(vl)}` : ''}</div></div>
      ${s.photo?.credit ? `<div class="credit">${esc(String(s.photo.credit).replace(/, some rights reserved.*$/i, ''))}</div>` : ''}</div>
    <div class="detail-list">
      <div><span>Datum</span><span>${esc(dayLabel(s.date))}${s.time ? `, ${esc(s.time)}` : ''}</span></div>
      <div><span>Plek</span><span>${esc(s.place || '—')}</span></div>
      <div><span>Land</span><span>${s.country ? `${flag(s.country)} ${esc(countryName(s.country))}` : '—'}</span></div>
      <div><span>Aantal</span><span>${esc(s.count || 1)}</span></div>
      ${vl ? `<div><span>Kleed / geslacht</span><span>${esc(vl)}</span></div>` : ''}
      ${s.en ? `<div><span>Engels</span><span>${esc(s.en)}</span></div>` : ''}
      <div><span>In je boekje</span><span>${sameSpecies}× ${firstIds.has(s.id) ? '· eerste keer!' : ''}</span></div>
    </div>
    ${s.note ? `<div class="note-box">${esc(s.note)}</div>` : ''}
    <div class="link-row">
      <a href="https://waarneming.nl/species/search/?q=${encodeURIComponent(s.sci)}" target="_blank" rel="noopener">${esc('Soort op waarneming.nl')} ↗</a>
      ${Number.isFinite(s.lat) ? `<a href="https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=15/${s.lat}/${s.lng}" target="_blank" rel="noopener">Plek op de kaart ↗</a>` : ''}
    </div>
    <div class="actions"><button class="btn primary wide" id="dEdit">${ICON.edit} Bewerken</button>
      <button class="btn ghost wide" id="dAgain">${ICON.plus} Nog een ${esc(s.name.toLowerCase())}</button></div>`);
  $('#dEdit', panel).onclick = () => openEditor(s);
  $('#dAgain', panel).onclick = () => {
    const sp = spBySci(s.sci) || { nl: s.name, en: s.en, sci: s.sci, pop: 0, ph: '' };
    openEditor(null, { species: sp });
  };
}

function openSpecies(sci) {
  const items = sortedSightings().filter(s => s.sci === sci);
  if (items.length === 1) return openDetail(items[0].id);
  const e = lifeList().find(x => x.sci === sci);
  const lifers = firstSeenIds();
  const panel = openSheet(`
    <div class="sheet-head"><h2>${esc(e.name)}</h2><button class="icon-btn" data-close aria-label="Sluiten">${ICON.close}</button></div>
    <div class="hero" style="aspect-ratio:16/9">${e.photo ? `<img src="${esc(sized(e.photo, 'medium'))}" alt="">` : `<div class="ph-big">${BIRD_SVG}</div>`}
      <div class="shade"><div class="n">${esc(e.name)}</div><div class="s">${esc(sci)}</div></div></div>
    <div class="detail-list">
      <div><span>Gezien</span><span>${e.n}× (${e.birds} vogels)</span></div>
      <div><span>Eerste keer</span><span>${esc(fmtShort.format(dateObj(e.first)))}</span></div>
      <div><span>Laatst</span><span>${esc(fmtShort.format(dateObj(e.last)))}</span></div>
      <div><span>Landen</span><span>${[...e.countries].map(c => `${flag(c)} ${esc(countryName(c))}`).join(', ') || '—'}</span></div>
    </div>
    ${items.map(s => cardHtml({ ...s, name: dayLabel(s.date) }, lifers.has(s.id))).join('')}`);
  $$('[data-open]', panel).forEach(b => b.onclick = () => openDetail(b.dataset.open));
}

// ---------- instellingen ----------
function openSettings() {
  const home = state.settings.home || HOME_DEFAULT;
  const panel = openSheet(`
    <div class="sheet-head"><h2>Instellingen</h2><button class="icon-btn" data-close aria-label="Sluiten">${ICON.close}</button></div>
    <div class="settings-group"><h3>Thuisplek</h3><p>Voor “In de buurt”. Nu: <b>${esc(home.name)}</b></p>
      <div class="row loc-box"><input class="input" id="homeInp" placeholder="Zoek een plaats" autocomplete="off"><button class="btn gps" id="homeGps" aria-label="Huidige locatie">${ICON.gps}</button>
      <div class="sugs loc-sugs hidden" id="homeSugs"></div></div></div>
    <div class="settings-group"><h3>Back-up</h3><p>${state.sightings.length} waarnemingen. Download ze als spreadsheet of als back-upbestand.</p>
      <div class="row"><button class="btn" id="expCsv">Excel / CSV</button><button class="btn" id="expJson">Back-up</button></div>
      <label class="btn ghost" style="cursor:pointer">Back-up terugzetten<input type="file" id="impJson" accept="application/json,.json" hidden></label></div>
    ${DEMO ? '<div class="settings-group"><h3>Demo</h3><p>Dit is de demo: alles blijft alleen op dit apparaat.</p><button class="btn" id="demoReset">Demo opnieuw beginnen</button></div>'
      : `<div class="settings-group"><h3>Account</h3><p>Ingelogd als <b>${esc(user || '')}</b>. Je wachtwoord wijzig je in de planner.</p><button class="btn danger" id="logout">Uitloggen</button></div>`}
    <p class="credits">Soortnamen: <a href="https://www.worldbirdnames.org" target="_blank" rel="noopener">IOC World Bird List 15.2</a> · Foto's: waarnemers op <a href="https://www.inaturalist.org" target="_blank" rel="noopener">iNaturalist</a> · In de buurt: <a href="https://waarneming.nl" target="_blank" rel="noopener">waarneming.nl</a> · Plaatsen en kaart: © OpenStreetMap-bijdragers, Photon</p>`);

  const inp = $('#homeInp', panel), box = $('#homeSugs', panel);
  let t;
  const setHome = h => { state.settings.home = h; near.where = null; near.data = null; commit(); closeSheet(); toast(`Thuisplek: ${h.name}`); };
  inp.oninput = () => {
    clearTimeout(t);
    if (inp.value.trim().length < 3) { box.classList.add('hidden'); return; }
    t = setTimeout(async () => {
      let res = [];
      try { res = await placeSearch(inp.value.trim(), home); } catch { /* offline */ }
      box.classList.toggle('hidden', !res.length);
      box.innerHTML = res.map((r, i) => `<button class="sug" data-i="${i}"><div class="t"><div class="n" style="font-size:15px">${flag(r.country)} ${esc(r.place)}</div><div class="s">${esc(r.sub)}</div></div></button>`).join('');
      $$('.sug', box).forEach(b => b.onclick = () => { const r = res[+b.dataset.i]; setHome({ name: r.place, country: r.country, lat: r.lat, lng: r.lng }); });
    }, 350);
  };
  $('#homeGps', panel).onclick = async () => {
    try { const p = await getPosition(); const g = await reverseGeocode(p.lat, p.lng); setHome({ name: g.place || 'Mijn locatie', country: g.country, lat: g.lat, lng: g.lng }); }
    catch { toast('Locatie niet beschikbaar'); }
  };
  $('#expCsv', panel).onclick = exportCsv;
  $('#expJson', panel).onclick = () => download(`vogels-backup-${todayStr()}.json`, JSON.stringify(state, null, 1), 'application/json');
  $('#impJson', panel).onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      const incoming = Array.isArray(d.sightings) ? d.sightings : [];
      const ids = new Set(state.sightings.map(s => s.id));
      const add = incoming.filter(s => s && s.id && s.sci && s.date && !ids.has(s.id));
      state.sightings.push(...add);
      commit(); closeSheet();
      toast(`${add.length} waarnemingen teruggezet`);
    } catch { toast('Dit bestand kan ik niet lezen'); }
  };
  $('#logout', panel) && ($('#logout', panel).onclick = async () => {
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(LS_CACHE);
    location.reload();
  });
  $('#demoReset', panel) && ($('#demoReset', panel).onclick = () => { localStorage.removeItem(LS_CACHE); location.reload(); });
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function exportCsv() {
  const cols = ['Datum', 'Tijd', 'Soort', 'Wetenschappelijke naam', 'Engels', 'Kleed', 'Geslacht', 'Aantal', 'Plek', 'Land', 'Breedtegraad', 'Lengtegraad', 'Notitie'];
  const q = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rows = sortedSightings().reverse().map(s => [s.date, s.time, s.name, s.sci, s.en, s.plumage, s.sex, s.count, s.place, countryName(s.country), s.lat ?? '', s.lng ?? '', s.note]);
  download(`vogels-${todayStr()}.csv`, '﻿' + [cols, ...rows].map(r => r.map(q).join(';')).join('\n'), 'text/csv;charset=utf-8');
}

// ---------- events ----------
document.addEventListener('click', e => {
  const t = e.target;
  const tb = t.closest('#tabs [data-tab]');
  if (tb) { tab = tb.dataset.tab; lsSet('dv_tab', tab); render(); scrollTo(0, 0); return; }
  if (t.closest('#addBtn') || t.closest('[data-add]')) { openEditor(null); return; }
  const op = t.closest('#view [data-open]');
  if (op) { openDetail(op.dataset.open); return; }
  const spc = t.closest('#view [data-species]');
  if (spc) { openSpecies(spc.dataset.species); return; }
  if (t.closest('#settingsBtn')) openSettings();
  if (t.closest('#themeBtn')) {
    const order = ['auto', 'light', 'dark'];
    state.settings.theme = order[(order.indexOf(state.settings.theme || 'auto') + 1) % 3];
    applyTheme();
    commit();
  }
});

// ---------- login & opstart ----------
function showLogin() {
  buildTokyo();
  FX.setMode(34, season());
  $('#boot').classList.add('hidden');
  $('#app').classList.add('hidden');
  $('#lock').classList.remove('hidden');
  setTimeout(() => $('#loginUser').focus(), 50);
}
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('#loginBtn'), err = $('#lockErr');
  btn.disabled = true; err.textContent = '';
  try {
    const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('#loginUser').value, password: $('#loginPass').value }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Inloggen mislukt');
    $('#lock').classList.add('hidden');
    await start();
  } catch (x) {
    err.textContent = x.message;
    $('.lock-box').classList.remove('shake'); void $('.lock-box').offsetWidth; $('.lock-box').classList.add('shake');
  }
  btn.disabled = false;
});

function demoState() {
  const d = new Date();
  const ago = n => todayStr(new Date(d.getTime() - n * 864e5));
  const mk = (sci, name, en, date, time, place, country, lat, lng, extra = {}) => ({ id: uid(), sci, name, en, plumage: '', sex: '', count: 1, date, time, place, country, lat, lng, note: '', photo: null, created: new Date().toISOString(), created_ts: 0, ...extra });
  return normalizeState({
    sightings: [
      mk('Sturnus vulgaris', 'Spreeuw', 'Common Starling', ago(0), '09:12', 'Hilversumse Meent, Hilversum', 'NL', 52.2463, 5.1924, { plumage: 'winterkleed', count: 40, note: 'Grote zwerm boven het weiland' }),
      mk('Erithacus rubecula', 'Roodborst', 'European Robin', ago(0), '09:30', 'Hilversumse Meent, Hilversum', 'NL', 52.2463, 5.1924),
      mk('Alcedo atthis', 'IJsvogel', 'Common Kingfisher', ago(1), '16:05', 'Spanderswoud, Hilversum', 'NL', 52.2062, 5.1517, { note: 'Zat op een tak boven de sloot' }),
      mk('Dendrocopos major', 'Grote Bonte Specht', 'Great Spotted Woodpecker', ago(1), '15:40', 'Spanderswoud, Hilversum', 'NL', 52.2062, 5.1517, { sex: 'man' }),
      mk('Anas platyrhynchos', 'Wilde Eend', 'Mallard', ago(3), '11:20', 'Loosdrechtse Plassen, Wijdemeren', 'NL', 52.2104, 5.0861, { sex: 'man', count: 6 }),
      mk('Ardea cinerea', 'Blauwe Reiger', 'Grey Heron', ago(3), '11:35', 'Loosdrechtse Plassen, Wijdemeren', 'NL', 52.2104, 5.0861),
      mk('Upupa epops', 'Hop', 'Eurasian Hoopoe', ago(40), '08:50', 'Algarve, Faro', 'PT', 37.0194, -7.9304),
      mk('Merops apiaster', 'Bijeneter', 'European Bee-eater', ago(41), '18:10', 'Ria Formosa, Faro', 'PT', 37.0089, -7.8836, { count: 5 }),
    ],
  });
}

async function hydratePhotos() {
  // demo / oude invoer zonder foto: foto er alsnog bij zoeken
  await loadSpecies();
  let changed = false;
  for (const s of state.sightings) {
    if (s.photo?.url) continue;
    const sp = spBySci(s.sci);
    if (!sp) continue;
    const p = await bestPhoto(sp, s);
    if (p) { s.photo = { url: p.url, credit: p.credit }; changed = true; }
  }
  if (changed) { if (DEMO) { lsSet(LS_CACHE, { state, dirty: false }); render(); } else commit(); }
}

async function start() {
  if (DEMO) {
    const c = lsGet(LS_CACHE, null);
    state = c?.state ? normalizeState(c.state) : demoState();
    user = 'demo';
  } else {
    const c = lsGet(LS_CACHE, null);
    try {
      const r = await fetch('/api/state', { cache: 'no-store' });
      if (r.status === 401) { showLogin(); return; }
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      user = d.user;
      if (c?.dirty && c.user === user && c.state) { state = normalizeState(c.state); dirty = true; push(); }
      else state = normalizeState(d.data);
      lsSet(LS_CACHE, { state, dirty, user });
    } catch {
      if (c?.state) { state = normalizeState(c.state); user = c.user; dirty = !!c.dirty; setSync('err', 'Offline — wordt later opgeslagen'); }
      else { showLogin(); return; }
    }
  }
  $('#boot').classList.add('hidden');
  $('#lock').classList.add('hidden');
  $('#app').classList.remove('hidden');
  applyTheme();
  applyFx();
  tokyoTick();
  setSync(dirty ? 'busy' : '', dirty ? 'Opslaan…' : '');
  render();
  loadSpecies().then(() => { if (tab === 'buurt') render(); });
  hydratePhotos();
}

// nieuwe versie live gezet? eerst opslaan, dan vanzelf verversen (zoals de planner)
const MY_VERSION = (document.querySelector('script[src*="app.js"]')?.getAttribute('src').match(/v=(\d+)/) || [])[1];
async function checkVersion() {
  if (DEMO || !MY_VERSION || document.hidden || !$('#sheet').classList.contains('hidden')) return;
  try {
    const html = await (await fetch('/', { cache: 'no-store' })).text();
    const live = (html.match(/app\.js\?v=(\d+)/) || [])[1];
    if (live && live !== MY_VERSION) { if (dirty) await push(); location.reload(); }
  } catch { /* offline */ }
}
document.addEventListener('visibilitychange', checkVersion);
setInterval(checkVersion, 10 * 60 * 1000);
setInterval(() => { if (!$('#app').classList.contains('hidden')) { applyTheme(); renderHead(); } }, 60000);


start();
