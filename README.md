# De Rode Lotus — website

De website van [De Rode Lotus](https://derodelotus.com), een buurtorganisatie met weggeefwinkel, voedselbedeling, spelotheek en creatief atelier. Gebouwd met [Astro](https://astro.build) en gehost als Cloudflare Worker, met een eigen, eenvoudig beheer onder `/beheer`.

## Hoe het in elkaar zit

- **Publieke site**: startpagina, een pagina per activiteit, de vrijwilligerspagina met aanmeldformulier, en doneren via overschrijving (IBAN met EPC-QR-code).
- **Beheer** (`/beheer`): één beheerdersaccount. Teksten, uren, activiteiten, vrijwilligers, veelgestelde vragen, mededeling en doneergegevens worden als ontwerp bewaard en pas zichtbaar na **Publiceren**. Foto’s worden verkleind en in R2 bewaard. Aanmeldingen van nieuwe vrijwilligers komen in de inbox.
- **Opslag**: Cloudflare D1 voor inhoud, foto-gegevens en aanmeldingen; R2 voor geüploade foto’s. De JSON-bestanden in `src/data/` zijn de standaardinhoud zolang er nog niets gepubliceerd is.
- **Beveiliging**: wachtwoord als PBKDF2-hash, ondertekende sessiecookie, Content-Security-Policy, Cloudflare Turnstile en rate limiting op het formulier. Zie `src/middleware.ts` en `src/lib/`.

## Lokaal werken

```bash
npm ci
cp .dev.vars.example .dev.vars   # vul een wachtwoordhash en SESSION_SECRET in
npm run db:migrate:local
npm run dev
```

Een wachtwoordhash maak je met `npm run admin:password -- --print`. Lokaal gebruikt het formulier de testsleutel van Turnstile; er wordt geen e-mail verstuurd.

## Controle en build

```bash
npm run check
npm run build
```

`npm run build:public` is de publicatiepoort: die stopt zolang de organisatie de inhoud en de fotorechten niet bevestigd heeft (`src/data/publication.json`). Die bevestiging is er sinds 1 oktober 2026. Alleen `derodelotus.com` zelf is indexeerbaar; www, preview, staging, beheer en voorbeeldweergaven blijven `noindex` (`isIndexableHost` in `src/lib/http.ts`).

## Deploy

```bash
npm run db:migrate:staging
npm run deploy:staging
```

Productie deployt automatisch: elke push naar `main` draait `.github/workflows/deploy.yml` (check, `build:public`, `db:migrate:production`, `wrangler deploy`). Daarvoor staan de GitHub-secrets `CLOUDFLARE_API_TOKEN` en `CLOUDFLARE_ACCOUNT_ID` in de repository; zonder die secrets slaat de workflow de deploy over. Met de hand kan het ook: `npm run db:migrate:production && npm run build:public && npx wrangler deploy`. Geheimen (`ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `TURNSTILE_SECRET`) zet je met `npm run admin:password` of `wrangler secret put`, nooit in deze repository.

Meer uitleg voor beheerders staat in [`BEHEER.md`](BEHEER.md), de vormgeving in [`DESIGN.md`](DESIGN.md) en de herkomst van de foto’s in [`PHOTO-SOURCES.md`](PHOTO-SOURCES.md).
