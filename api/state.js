import { getUser, loadState, readBody, saveState, send } from './_lib.js';

export default async function handler(req, res) {
  try {
    const user = await getUser(req);
    if (!user) return send(res, 401, { error: 'Niet ingelogd' });

    if (req.method === 'GET') {
      const data = await loadState(user);
      return send(res, 200, { user, data });
    }
    if (req.method === 'PUT') {
      const body = await readBody(req);
      if (!body || typeof body.data !== 'object' || Array.isArray(body.data) || !Array.isArray(body.data.sightings)) {
        return send(res, 400, { error: 'Ongeldige gegevens' });
      }
      const savedAt = await saveState(user, body.data);
      return send(res, 200, { ok: true, savedAt });
    }
    return send(res, 405, { error: 'Methode niet toegestaan' });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: 'Opslaan mislukt' });
  }
}
