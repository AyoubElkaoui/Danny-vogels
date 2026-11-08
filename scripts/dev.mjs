// Lokale testserver: serveert /public en stuurt /api/* door naar de functies (zoals Vercel).
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// .env.development (lokaal test-account) gaat voor .env.local
for (const name of ['.env.development', '.env.local']) {
  try {
    const env = await fs.readFile(path.join(root, name), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
    }
  } catch { /* bestand bestaat niet */ }
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.ico': 'image/x-icon' };
const PORT = Number(process.env.PORT || 3600);

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).replace(/[^a-z]/g, '');
      const mod = await import(pathToFileURL(path.join(root, 'api', `${name}.js`)).href + `?t=${Date.now()}`);
      return await mod.default(req, res);
    }
    let file = path.join(root, 'public', decodeURIComponent(url.pathname));
    if (!file.startsWith(path.join(root, 'public'))) { res.statusCode = 403; return res.end(); }
    if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
    const data = await fs.readFile(file);
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ERR_MODULE_NOT_FOUND') { res.statusCode = 404; return res.end('Niet gevonden'); }
    console.error(e);
    res.statusCode = 500; res.end('Fout');
  }
}).listen(PORT, () => console.log(`Danny's Vogels draait op http://localhost:${PORT}`));
