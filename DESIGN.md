# De Rode Lotus — gekozen vormgeving

Deze Astro-site volgt het gekozen ontwerp **De Vertrouwde Buurtorganisatie**: warm, documentair en eenvoudig te lezen.

## Visueel systeem

- Echte, documentaire foto’s voeren de pagina aan; geen AI-gegenereerde beelden.
- Een grote fotohero met witte tekst links, een zwevende witte navigatie en een overlappende praktische informatiebalk maken de eerste indruk.
- Warm wit `#fbfaf6` draagt de content; diepblauw `#173252` ordent de openingsuren; lotusrood `#bd2f33` markeert acties.
- Atkinson Hyperlegible wordt lokaal meegebouwd, niet van Google Fonts geladen.
- Controls hebben bescheiden afronding en korte, functionele feedback. Bewegingsvoorkeuren en hoog contrast blijven gerespecteerd.

## Inhoud en beheer

De pagina blijft kort: welkom, praktische gegevens, activiteiten, uren, ontmoeting, meehelpen en vragen. Editors wijzigen teksten, uren, foto’s, activiteiten, FAQ en mededeling via de velden in `/beheer`; ze wijzigen niet de layout of navigatiecode.

Elke foto op de site moet in `PHOTO-SOURCES.md` met maker, bron en toestemming worden geregistreerd. De publicatiepoort in `scripts/check-publication.mjs` vereist bevestigde inhoud en rechten.

## Logo

Het lotuslogo is blaadje per blaadje nagetekend naar het originele logo en wordt gegenereerd door `scripts/build-logo.mjs` (`src/components/Logo.astro` en `public/favicon.svg`). Pas het logo daar aan.
