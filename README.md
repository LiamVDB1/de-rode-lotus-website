# De Rode Lotus — website

Een kleine, statische Astro-website op basis van de gekozen mockup **De Vertrouwde Buurtorganisatie**.

## Lokaal bekijken

```bash
npm ci
npm run dev
```

Open het lokale adres dat Astro toont. De huidige foto’s komen voor deze werkversie nog van Gent Samen Solidair; ze staan niet als gedownloade bestanden in de repo. De foto’s zijn echt, niet AI-gegenereerd. Hergebruikrechten zijn nog niet bevestigd.

## Wat De Rode Lotus straks kan beheren

Via [Pages CMS](https://app.pagescms.org) staan de volgende onderdelen als Nederlandstalige velden klaar:

- de welkomsttekst, overige sectieteksten en zoekmachinebeschrijving;
- adres, telefoon, e-mail en openingsdagen/uren;
- activiteiten toevoegen, verwijderen, herschikken en beschrijven;
- per foto een eigen beeld uploaden en een fotobeschrijving invullen;
- veelgestelde vragen toevoegen, aanpassen en verwijderen;
- een tijdelijke mededeling aan- of uitzetten.

De vormgeving, navigatie en knoppenstructuur blijven in code. Daardoor kan een gewone inhoudswijziging de layout niet wijzigen. Een CMS-wijziging wordt opgeslagen als Git-commit. Bij gekoppelde hosting wordt daarna een nieuwe statische versie gebouwd.

De configuratie staat in [`.pages.yml`](.pages.yml). De site leest rechtstreeks de JSON-bestanden in `src/data/`; er is geen database, API-sleutel of eigen loginpagina. Voorlopig krijgt alleen Liam toegang. Later kan De Rode Lotus toegang krijgen via de GitHub-/Pages-CMS-rechten van deze afzonderlijke repository.

## Controle en build

```bash
npm run check
npm run build
```

`npm run build` maakt een **werkversie**. `npm run build:public` is de publicatiepoort: die stopt zolang de organisatie de inhoud niet bevestigd heeft, foto-rechten niet vaststaan, of een foto niet als lokale upload aanwezig is. De checks staan in `scripts/` en de status in `src/data/publication.json`. Alleen de beheerder van de repo wijzigt die publicatiestatus; ze staat bewust niet in Pages CMS.

De GitHub Action controleert bij iedere inhoudswijziging de velden en de Astro-build. De huidige foto’s worden alleen als tijdelijke externe preview gebruikt. Wie een nieuwe activiteit toevoegt, moet een foto uploaden.

## Publicatie, domein en e-mail

Er is nog **geen** publiek domein, Cloudflare-project of live CMS-sessie aangesloten. `wrangler.jsonc` bereidt een statische Cloudflare Workers-deploy voor; de site kan door haar statische output ook elders gehost worden. Koppel hosting pas na de publicatiecheck en na keuze van het organisatie-eigen domein.

Het domein hoort op naam van De Rode Lotus te staan, met Liam voorlopig als technisch beheerder. Het bestaande `derodelotus@outlook.com` kan gewoon blijven werken; een domeinmailbox is geen voorwaarde om de site online te brengen. DNS-, domein- en mailboxwijzigingen vragen later aparte, bewuste keuzes. Verander bestaande mail-DNS niet tijdens de websitelancering.

## Nog door De Rode Lotus te bevestigen

1. Adres, actuele uren, voedselbedeling/doorverwijzing, activiteitenteksten en contactgegevens.
2. Toestemming voor gebruik van iedere huidige foto, of eigen foto’s aanleveren/uploaden.
3. Wie uiteindelijk het domein en de editor-toegang beheert.

Meer detail staat in [`BEHEER.md`](BEHEER.md) en [`PHOTO-SOURCES.md`](PHOTO-SOURCES.md).
