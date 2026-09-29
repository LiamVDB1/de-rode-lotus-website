# Beheer — de website zelf aanpassen

## Aanmelden

Ga naar **derodelotus.com/beheer** en meld je aan met het beheerderswachtwoord. Klik op **Uitloggen** wanneer je klaar bent op een gedeelde computer.

## Inhoud aanpassen

1. Kies in het menu wat je wil aanpassen: startpagina, praktische info en uren, activiteiten, vrijwilligers, veelgestelde vragen, mededeling of doneren.
2. Pas de velden aan. Wijzigingen worden als **ontwerp** bewaard; bezoekers zien ze nog niet.
3. Bekijk het resultaat met het voorbeeld.
4. Klik op **Publiceren**. Vanaf dan staat de wijziging op de website.

## Foto’s

Onder **Foto’s** sleep je foto’s in de bibliotheek. Ze worden automatisch verkleind. Geef elke foto een korte beschrijving (“Twee vrijwilligers sorteren kleding”): dat helpt mensen met een schermlezer. Daarna kies je de foto bij een activiteit of vrijwilliger.

Vraag vooraf na of de foto op de website mag, en of herkenbare personen akkoord zijn. Noteer de herkomst in [`PHOTO-SOURCES.md`](PHOTO-SOURCES.md).

## Aanmeldingen van vrijwilligers

Wie het formulier op de vrijwilligerspagina invult, verschijnt onder **Inbox**. Neem contact op en zet de aanmelding daarna op **Afgehandeld**. Met **Op de vrijwilligerspagina zetten** maak je meteen een ontwerp aan voor de vrijwilligerspagina. Verwijder een aanmelding als iemand geen vrijwilliger wordt of erom vraagt.

## Actuele mededeling

Zet de mededeling aan, vul titel en bericht in en eventueel een einddatum. Na die datum verdwijnt ze vanzelf. Zet ze uit wanneer het bericht niet meer geldt.

## Publicatie en eigenaarschap

`src/data/publication.json` houdt bij of De Rode Lotus de inhoud en de fotorechten bevestigd heeft. Zet die waarden pas op `true` na een echte bevestiging. Pas daarna mag de site zichtbaar worden voor zoekmachines.

Zet nooit wachtwoorden of sleutels in deze repository. Het wachtwoord wijzigen gaat met `npm run admin:password`.
