# Danny's Vogels

Vogelboekje-webapp voor Danny: waarnemingen invoeren met autocomplete (alle ~11.000 vogelsoorten wereldwijd, Nederlandse namen), automatisch een foto erbij, zomer-/winterkleed en man/vrouw, plek + land (GPS of zoeken) en datum. Plus soortenlijst, kaart en "In de buurt" (recente meldingen van waarneming.nl rond zijn thuisplek). Demo zonder inlog: `/?demo`.

- `public/` – de app (vanilla JS): `app.js`, `style.css`, `species.json` (soortenlijst)
- `api/` – Vercel-functies: `login`, `logout`, `state` (opslaan in Neon Postgres, tabel `vogels_state`), `nearby` (doorgeefluik naar waarneming.nl, die geen CORS heeft)
- `scripts/dev.mjs` – lokale server op poort 3600
- `scripts/build-species.py` – bouwt `species.json` opnieuw uit de IOC Multilingual-lijst (worldbirdnames.org) + iNaturalist-populariteit

## Inloggen

Zelfde database als Danny's Planner (`DATABASE_URL`) → hetzelfde account als de planner: het wachtwoord komt uit de tabel `planner_auth`, anders uit `DANNY_PASSWORD_HASH`.

Omgevingsvariabelen in Vercel: `DATABASE_URL`, `DANNY_USERNAME`, `DANNY_PASSWORD_HASH`, `SESSION_SECRET` (mag dezelfde zijn als bij de planner).

## Lokaal

```bash
npm install
npm run dev                # http://localhost:3600/?demo
```

Lokaal inloggen: `.env.development` met `DANNY_USERNAME`, `DANNY_PASSWORD_HASH` en `SESSION_SECRET`. Zonder `DATABASE_URL` slaat de lokale server op in `.data/`.

## Live zetten

1. Verhoog in `public/index.html` het versienummer achter `?v=` bij de css- en js-bestanden.
2. Pushen naar `main` (Vercel is aan de repo gekoppeld) of `npx vercel --prod --yes`.

## Bronnen

Soortnamen: IOC World Bird List 15.2 · Foto's: iNaturalist (waarnemers, met naamsvermelding) · In de buurt: waarneming.nl · Plaatsen: Nominatim/Photon (OpenStreetMap) · Kaart: OpenStreetMap.
