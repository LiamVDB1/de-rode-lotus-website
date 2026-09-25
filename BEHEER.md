# Beheer — voor Liam en later De Rode Lotus

## Inhoud aanpassen

1. Ga naar [app.pagescms.org](https://app.pagescms.org) en meld je aan met het GitHub-account dat toegang heeft tot deze repository.
2. Open de repository **de-rode-lotus-website**. Pages CMS leest automatisch `.pages.yml` op de hoofdbranch.
3. Kies **Startpagina**, **Adres, contact en uren**, **Wat we doen**, **Veelgestelde vragen** of **Actuele mededeling**.
4. Bewaar de wijziging. Pages CMS schrijft een commit naar GitHub. Controleer daarna of de automatische websitecontrole groen is en, zodra hosting gekoppeld is, of de gepubliceerde site klopt.

Dit is een voorbereid beheerproces. Het is pas daadwerkelijk bruikbaar nadat de private GitHub-repository is aangemaakt, de Pages CMS GitHub App erop is geïnstalleerd en de bevoegde gebruiker is aangemeld.

## Foto’s vervangen

Gebruik bij de betreffende sectie het veld **Foto** om een echte foto te uploaden. Vul ook **Beschrijf de foto** in, bijvoorbeeld “Twee vrijwilligers sorteren kleding in de weggeefwinkel”. Pages CMS slaat de upload op in `public/uploads` en schrijft `/uploads/bestandsnaam.jpg` in het inhoudsbestand.

Vraag vooraf na of De Rode Lotus de foto op een publieke website mag tonen, of herkenbare personen met dit gebruik akkoord zijn, en wie de maker is. De huidige previewbeelden zijn extern gepubliceerde foto’s; publieke beschikbaarheid is geen hergebruiklicentie. Verwijder oude uploads pas als zeker is dat ze nergens meer gebruikt worden.

## Actuele mededeling

Zet **Mededeling tonen** aan, vul titel en bericht in, en eventueel een einddatum `JJJJ-MM-DD`. De site verbergt de mededeling na die datum in de browser. Zet haar ook in Pages CMS uit of verwijder de tekst wanneer het bericht niet meer geldt. Een einddatum alleen maakt geen nieuwe Git-commit of herbouw.

## Publicatie en eigenaarschap

De organisatie heeft nu alleen het ontwerp positief beoordeeld. Daarom staan `approvedByOrganisation` en `photoRightsConfirmed` bewust op `false`. Een beheerder zet die pas na expliciete bevestiging op `true`, vult de datum in en controleert de foto’s. `npm run build:public` moet dan slagen. Deze stap is geen cosmetische schakelaar: de bevestiging zelf moet echt gebeurd zijn.

Voorlopig krijgt alleen Liam editor-toegang. Geef later iemand van De Rode Lotus toegang door de eigendoms- en GitHub-/Pages-CMS-instellingen bewust over te dragen. Zet geen wachtwoorden of tokens in deze repository.
