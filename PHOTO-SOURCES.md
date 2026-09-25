# Fotoherkomst in de werkversie

De huidige externe beelden zijn afkomstig van de [publieke Gent Samen Solidair-pagina over De Rode Lotus](https://gentsamensolidair.be/organisatie/de-rode-lotus/). Ze zijn gekozen omdat ze de echte werking tonen. **Hergebruikrechten, maker en toestemming van herkenbare personen zijn niet vastgesteld.** Ze staan als externe preview-URL’s in `src/data/preview-photos.json`, niet als gekopieerde bestanden onder `public/uploads`.

| Gebruik | Huidige bron | Vervanging via CMS |
| --- | --- | --- |
| Grote foto | `rodelotus-5-of-12-scaled.jpg` | Startpagina → Grote foto |
| Weggeefwinkel | `rodelotus-8-of-12-scaled…jpg` | Wat we doen → Weggeefwinkel → Foto |
| Voedselbedeling | `rodelotus-7-of-12-scaled…jpg` | Wat we doen → Voedselbedeling → Foto |
| Spelotheek | `rodelotus-10-of-12-scaled…jpg` | Wat we doen → Spelotheek → Foto |
| Creatief atelier | `rodelotus-11-of-12-scaled…jpg` | Wat we doen → Creatief atelier → Foto |
| Ontmoetingsplek | `rodelotus-12-of-12-scaled…jpg` | Startpagina → Foto ontmoetingsplek |

De [Facebook-pagina van De Rode Lotus](https://www.facebook.com/derodelotus/) is een mogelijke bron om samen met hen nieuwe foto’s te selecteren. Foto’s van Facebook of andere openbare pagina’s worden niet automatisch overgenomen. Vraag De Rode Lotus om hun eigen originelen of expliciete toestemming van de rechthebbende, liefst met voldoende resolutie voor de grote foto.

Wanneer een foto in `public/uploads` wordt gezet, voeg aan dit bestand toe: bestandsnaam, maker/bron, wie toestemming gaf, datum en eventuele voorwaarden. Voor herkenbare bezoekers hoort ook de toestemming voor publicatie te zijn opgehelderd. Deze provenance is menselijk te controleren; de buildcheck kan alleen bestandspaden en aanwezigheid verifiëren.
