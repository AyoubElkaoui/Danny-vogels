// Maakt een sterk wachtwoord + sessiesleutel aan.
// - Het wachtwoord komt ALLEEN in LOGIN.txt (staat niet in git en gaat niet naar Vercel).
// - De bcrypt-hash en sleutel komen in .env.local (voor lokaal testen en om naar Vercel te zetten).
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';

const username = (process.argv[2] || 'danny').toLowerCase();
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const bytes = crypto.randomBytes(18);
const password = Array.from(bytes, b => alphabet[b % alphabet.length]).join('').replace(/(.{6})(?=.)/g, '$1-');
const hash = await bcrypt.hash(password, 12);
const secret = crypto.randomBytes(48).toString('base64url');

let env = '';
try { env = await fs.readFile('.env.local', 'utf8'); } catch { /* nieuw */ }
const set = (k, v) => {
  const line = `${k}=${v}`;
  env = env.match(new RegExp(`^${k}=.*$`, 'm')) ? env.replace(new RegExp(`^${k}=.*$`, 'm'), line) : (env ? env.replace(/\n?$/, '\n') : '') + line + '\n';
};
set('DANNY_USERNAME', username);
set('DANNY_PASSWORD_HASH', hash);
set('SESSION_SECRET', secret);
await fs.writeFile('.env.local', env);
await fs.writeFile('LOGIN.txt', `Danny's Vogels — inloggegevens\n\nGebruikersnaam: ${username}\nWachtwoord:     ${password}\n\nBewaar dit veilig en geef het alleen aan Danny.\n`);
console.log('Inlog aangemaakt: zie LOGIN.txt (wachtwoord) en .env.local (hash + sleutel).');
