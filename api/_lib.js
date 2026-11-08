import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const COOKIE = 'dv_session';
const MAX_AGE = 60 * 60 * 24 * 60; // 60 dagen

// ---------- helpers ----------
export function send(res, status, body, cache = 'no-store') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
    if (Buffer.isBuffer(req.body)) return req.body.length ? JSON.parse(req.body.toString('utf8')) : {};
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 4_000_000) throw new Error('Body te groot');
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET ontbreekt');
  return s;
}

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${mac}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [data, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  const a = Buffer.from(mac || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!p.exp || p.exp < Date.now() / 1000) return null;
    return p;
  } catch {
    return null;
  }
}

function cookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function isSecure(req) {
  const host = req.headers.host || '';
  return !(host.startsWith('localhost') || host.startsWith('127.0.0.1'));
}

// vingerafdruk van de huidige wachtwoord-hash: na een wachtwoordwissel worden oude sessies ongeldig
const fingerprint = hash => crypto.createHmac('sha256', secret()).update(hash || '').digest('base64url').slice(0, 16);

export function setSession(req, res, user, hash) {
  const token = sign({ u: user, f: fingerprint(hash), exp: Math.floor(Date.now() / 1000) + MAX_AGE });
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${isSecure(req) ? '; Secure' : ''}`);
}

export function clearSession(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure(req) ? '; Secure' : ''}`);
}

export async function getUser(req) {
  const p = verify(cookies(req)[COOKIE]);
  if (!p) return null;
  const hash = await currentHash(p.u);
  if (!hash || p.f !== fingerprint(hash)) return null;
  return p.u;
}

// ---------- wachtwoord ----------
// Draait deze app op dezelfde database als Danny's Planner, dan geldt automatisch
// het wachtwoord dat Danny daar heeft ingesteld (tabel planner_auth).
// Anders: DANNY_PASSWORD_HASH uit de omgeving.
export async function currentHash(user) {
  if (!user || user !== String(process.env.DANNY_USERNAME || '').toLowerCase()) return null;
  if (db()) {
    try {
      const r = await db().query('select hash from planner_auth where id = $1', [user]);
      if (r.rows[0]?.hash) return r.rows[0].hash;
    } catch { /* tabel bestaat niet: eigen database */ }
  }
  return process.env.DANNY_PASSWORD_HASH || null;
}

// ---------- opslag ----------
let pool;
let ready = false;
const LOCAL_FILE = path.join(process.cwd(), '.data', 'state.json');

function db() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  }
  return pool;
}

async function ensure() {
  if (ready) return;
  await db().query(`create table if not exists vogels_state (
    id text primary key,
    data jsonb not null,
    updated_at timestamptz not null default now()
  )`);
  ready = true;
}

export async function loadState(user) {
  if (!db()) {
    try {
      const all = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8'));
      return all[user] || null;
    } catch {
      return null;
    }
  }
  await ensure();
  const r = await db().query('select data, updated_at from vogels_state where id = $1', [user]);
  return r.rows[0] ? { ...r.rows[0].data, _savedAt: r.rows[0].updated_at } : null;
}

export async function saveState(user, data) {
  delete data._savedAt;
  if (!db()) {
    let all = {};
    try { all = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')); } catch { /* nieuw bestand */ }
    all[user] = data;
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await fs.writeFile(LOCAL_FILE, JSON.stringify(all));
    return new Date().toISOString();
  }
  await ensure();
  const r = await db().query(
    `insert into vogels_state (id, data, updated_at) values ($1, $2, now())
     on conflict (id) do update set data = excluded.data, updated_at = now()
     returning updated_at`, [user, data]);
  return r.rows[0].updated_at;
}
