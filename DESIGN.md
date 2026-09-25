# De Rode Lotus — gekozen vormgeving

Deze Astro-site zet de door Liam gekozen mockup **De Vertrouwde Buurtorganisatie** om naar een bewerkbare website. Dit is een behoudende port, geen nieuwe ontwerprichting.

## Visueel systeem

- Echte, documentaire foto’s voeren de pagina aan; geen AI-gegenereerde beelden.
- Een grote fotohero met witte tekst links, een zwevende witte navigatie en een overlappende praktische informatiebalk maken de eerste indruk.
- Warm wit `#fbfaf6` draagt de content; diepblauw `#173252` ordent de openingsuren; lotusrood `#bd2f33` markeert acties.
- Atkinson Hyperlegible wordt lokaal meegebouwd, niet van Google Fonts geladen.
- Controls hebben bescheiden afronding en korte, functionele feedback. Bewegingsvoorkeuren en hoog contrast blijven gerespecteerd.

## Inhoud en beheer

De pagina blijft kort: welkom, praktische gegevens, activiteiten, uren, ontmoeting, meehelpen en vragen. Editors wijzigen teksten, uren, foto’s, activiteiten, FAQ en mededeling via de gestructureerde velden in `.pages.yml`; ze wijzigen niet de layout of navigatiecode.

De huidige externe foto’s zijn alleen previewmateriaal. Elke publieke raster die later via `public/uploads` wordt gebruikt, moet in `PHOTO-SOURCES.md` met maker, bron en toestemming worden geregistreerd. De publicatiepoort in `scripts/check-publication.mjs` vereist bevestigde inhoud, rechten en lokale uploads.

## Controlegrens

Astro-check, inhoud/CMS-schema en een statische build zijn uitgevoerd. Een visuele desktop- en mobiele browservergelijking met de gekozen mockup is nog niet uitgevoerd; de lokale browsertoegang was in deze sessie niet beschikbaar voor geautomatiseerde inspectie.
