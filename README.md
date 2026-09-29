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

`npm run build:public` is de publicatiepoort: die stopt zolang de organisatie de inhoud en de fotorechten niet bevestigd heeft (`src/data/publication.json`). De site staat voorlopig op `noindex` (in `src/middleware.ts` en `src/layouts/PublicLayout.astro`); haal dat pas weg na die bevestiging.

## Deploy

```bash
npm run db:migrate:staging
npm run deploy:staging
```

Voor productie gebruik je `npm run db:migrate:production` en een deploy zonder staging-omgeving. Geheimen (`ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `TURNSTILE_SECRET`) zet je met `npm run admin:password` of `wrangler secret put`, nooit in deze repository.

Meer uitleg voor beheerders staat in [`BEHEER.md`](BEHEER.md), de vormgeving in [`DESIGN.md`](DESIGN.md) en de herkomst van de foto’s in [`PHOTO-SOURCES.md`](PHOTO-SOURCES.md).
