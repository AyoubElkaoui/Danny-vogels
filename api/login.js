import bcrypt from 'bcryptjs';
import { currentHash, readBody, send, setSession } from './_lib.js';

const wait = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Methode niet toegestaan' });
  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: 'Ongeldig verzoek' }); }

  const user = String(body.username || '').trim().toLowerCase();
  const pass = String(body.password || '');
  let hash = null;
  try { hash = await currentHash(user); } catch (e) { console.error(e); return send(res, 500, { error: 'Server niet bereikbaar' }); }
  const ok = hash ? await bcrypt.compare(pass, hash) : false;

  if (!ok) {
    await wait(800);
    return send(res, 401, { error: 'Gebruikersnaam of wachtwoord klopt niet' });
  }
  setSession(req, res, user, hash);
  return send(res, 200, { ok: true, user });
}
