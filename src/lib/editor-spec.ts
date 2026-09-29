import type { DocumentKey } from './schema';

/**
 * Beschrijft hoe elk document in /beheer bewerkt wordt. De browser bouwt het formulier op uit deze
 * beschrijving (src/scripts/admin/editor.ts); de server controleert alles opnieuw met src/lib/schema.ts.
 */
export type Field =
  | { kind: 'text'; name: string; label: string; help?: string; placeholder?: string; max?: number; wide?: boolean }
  | { kind: 'textarea'; name: string; label: string; help?: string; rows?: number; max?: number }
  | { kind: 'photo'; name: string; altName: string; label: string; help?: string }
  | { kind: 'toggle'; name: string; label: string; help?: string }
  | { kind: 'date'; name: string; label: string; help?: string }
  | { kind: 'amounts'; name: string; label: string; help?: string }
  | { kind: 'list'; name: string; label: string; help?: string; itemLabel: string; titleField: string; subtitleField?: string; photoField?: string; addLabel: string; newItem: Record<string, unknown>; fields: Field[] }
  | { kind: 'blocks'; name: string; label: string; help?: string }
  | { kind: 'group'; label: string; help?: string; fields: Field[] };

export interface DocumentEditor {
  key: DocumentKey;
  title: string;
  description: string;
  /** Waar je het resultaat ziet op de site. */
  previewPath: string;
  /** Lijsten zonder omhullend object (activiteiten, vragen) worden als { items } bewerkt. */
  rootList?: boolean;
  fields: Field[];
}



export const editors: Record<DocumentKey, DocumentEditor> = {
  home: {
    key: 'home',
    title: 'Startpagina',
    description: 'De grote foto bovenaan, de teksten op de startpagina en de huiskat.',
    previewPath: '/',
    fields: [
      {
        kind: 'group',
        label: 'Bovenaan de pagina',
        fields: [
          { kind: 'text', name: 'heroTitle', label: 'Grote titel', max: 120, wide: true },
          { kind: 'textarea', name: 'heroIntro', label: 'Korte intro', rows: 3, max: 400 },
          { kind: 'photo', name: 'heroPhoto', altName: 'heroPhotoAlt', label: 'Grote foto', help: 'Liefst een brede foto waarop mensen te zien zijn.' },
        ],
      },
      {
        kind: 'group',
        label: 'Wat we doen',
        help: 'De activiteiten zelf pas je aan onder Activiteiten.',
        fields: [
          { kind: 'text', name: 'servicesTitle', label: 'Titel', max: 120, wide: true },
          { kind: 'textarea', name: 'servicesIntro', label: 'Intro', rows: 3, max: 600 },
        ],
      },
      {
        kind: 'group',
        label: 'Ontmoetingsplek',
        fields: [
          { kind: 'text', name: 'storyTitle', label: 'Titel', max: 120, wide: true },
          { kind: 'textarea', name: 'storyText', label: 'Tekst', rows: 5, max: 1500 },
          { kind: 'photo', name: 'storyPhoto', altName: 'storyPhotoAlt', label: 'Foto' },
        ],
      },
      {
        kind: 'group',
        label: 'Onze huiskat',
        help: 'Dit blok verschijnt zodra de kat een naam en een foto heeft. De kat staat dan ook bij de vrijwilligers.',
        fields: [
          { kind: 'text', name: 'catName', label: 'Naam van de kat', max: 60 },
          { kind: 'textarea', name: 'catText', label: 'Over de kat', rows: 3, max: 600 },
          { kind: 'photo', name: 'catPhoto', altName: 'catPhotoAlt', label: 'Foto van de kat' },
        ],
      },
      {
        kind: 'group',
        label: 'Helpen en vragen',
        fields: [
          { kind: 'text', name: 'helpTitle', label: 'Titel “helpen”', max: 120, wide: true },
          { kind: 'textarea', name: 'helpIntro', label: 'Intro “helpen”', rows: 3, max: 600 },
          { kind: 'text', name: 'faqTitle', label: 'Titel veelgestelde vragen', max: 120, wide: true },
          { kind: 'textarea', name: 'faqIntro', label: 'Intro veelgestelde vragen', rows: 2, max: 600 },
        ],
      },
      {
        kind: 'group',
        label: 'Voor zoekmachines',
        help: 'Dit zie je in het tabblad van de browser en in zoekresultaten.',
        fields: [
          { kind: 'text', name: 'pageTitle', label: 'Paginatitel', max: 120, wide: true },
          { kind: 'textarea', name: 'metaDescription', label: 'Beschrijving', rows: 2, max: 300 },
        ],
      },
    ],
  },
  practical: {
    key: 'practical',
    title: 'Adres en openingsuren',
    description: 'Adres, telefoon, e-mail, sociale media en de openingsuren.',
    previewPath: '/#praktisch',
    fields: [
      {
        kind: 'group',
        label: 'Adres',
        fields: [
          { kind: 'text', name: 'street', label: 'Straat en nummer', max: 120 },
          { kind: 'text', name: 'postalCode', label: 'Postcode', max: 4 },
          { kind: 'text', name: 'city', label: 'Gemeente', max: 80 },
          { kind: 'text', name: 'neighbourhood', label: 'Wijk', max: 80 },
        ],
      },
      {
        kind: 'group',
        label: 'Contact',
        fields: [
          { kind: 'text', name: 'phoneDisplay', label: 'Telefoon (zoals je het leest)', placeholder: '0479 79 89 69', max: 30 },
          { kind: 'text', name: 'phoneInternational', label: 'Telefoon (internationaal)', placeholder: '+32479798969', help: 'Zo werkt de belknop op gsm’s.', max: 16 },
          { kind: 'text', name: 'email', label: 'E-mailadres', max: 200, wide: true },
          { kind: 'text', name: 'facebookUrl', label: 'Facebook-pagina', placeholder: 'https://www.facebook.com/…', wide: true },
          { kind: 'text', name: 'instagramUrl', label: 'Instagram (mag leeg)', placeholder: 'https://www.instagram.com/…', wide: true },
        ],
      },
      {
        kind: 'group',
        label: 'Openingsuren',
        fields: [
          { kind: 'text', name: 'hoursTitle', label: 'Titel', max: 120, wide: true },
          { kind: 'textarea', name: 'hoursIntro', label: 'Intro', rows: 2, max: 400 },
          {
            kind: 'list',
            name: 'hours',
            label: 'Dagen',
            itemLabel: 'Dag',
            titleField: 'day',
            addLabel: 'Dag toevoegen',
            newItem: { day: '', time: '', activity: '' },
            fields: [
              { kind: 'text', name: 'day', label: 'Dag', placeholder: 'Dinsdag', max: 30 },
              { kind: 'text', name: 'time', label: 'Uren', placeholder: '10u–12u en 13u–17u', max: 60 },
              { kind: 'textarea', name: 'activity', label: 'Wat is er open?', rows: 2, max: 300 },
            ],
          },
        ],
      },
    ],
  },
  activities: {
    key: 'activities',
    title: 'Activiteiten',
    description: 'De kaarten op de startpagina en de detailpagina per activiteit, met foto’s.',
    previewPath: '/#wat-we-doen',
    rootList: true,
    fields: [
      {
        kind: 'list',
        name: 'items',
        label: 'Activiteiten',
        help: 'Met de pijltjes wijzig je de volgorde. De eerste activiteit staat links bovenaan.',
        itemLabel: 'Activiteit',
        titleField: 'title',
        addLabel: 'Activiteit toevoegen',
        newItem: { slug: '', title: '', description: '', when: '', photo: '', photoAlt: '', blocks: [] },
        fields: [
          { kind: 'text', name: 'title', label: 'Naam', max: 80 },
          { kind: 'text', name: 'slug', label: 'Webadres', help: 'Deel achter derodelotus.com/activiteiten/. Enkel kleine letters en streepjes.', max: 60 },
          { kind: 'text', name: 'when', label: 'Wanneer', placeholder: 'Dinsdag en zaterdag · 10u–12u', max: 120, wide: true },
          { kind: 'textarea', name: 'description', label: 'Korte beschrijving (op de kaart)', rows: 3, max: 400 },
          { kind: 'photo', name: 'photo', altName: 'photoAlt', label: 'Hoofdfoto' },
          { kind: 'blocks', name: 'blocks', label: 'Detailpagina', help: 'Voeg tussentitels, tekst en zoveel foto’s toe als je wil.' },
        ],
      },
    ],
  },
  team: {
    key: 'team',
    title: 'Vrijwilligers',
    description: 'Iedereen die meehelpt, met foto en een korte voorstelling. Plus het aanmeldformulier.',
    previewPath: '/vrijwilligers',
    fields: [
      {
        kind: 'list',
        name: 'members',
        label: 'Vrijwilligers',
        help: 'Vraag altijd toestemming voor je iemands naam en foto op de site zet. Met de pijltjes wijzig je de volgorde.',
        itemLabel: 'Vrijwilliger',
        titleField: 'name',
        subtitleField: 'role',
        photoField: 'photo',
        addLabel: 'Vrijwilliger toevoegen',
        newItem: { name: '', role: '', photo: '', photoAlt: '', text: '' },
        fields: [
          { kind: 'text', name: 'name', label: 'Naam', max: 80 },
          { kind: 'text', name: 'role', label: 'Wat doet die?', placeholder: 'Weggeefwinkel op zaterdag', max: 80 },
          { kind: 'photo', name: 'photo', altName: 'photoAlt', label: 'Foto', help: 'Zonder foto tonen we de eerste letter van de naam.' },
          { kind: 'textarea', name: 'text', label: 'Voorstelling', help: 'Een paar zinnen over wie die is. Een witregel maakt een nieuwe alinea.', rows: 4, max: 800 },
        ],
      },
      {
        kind: 'group',
        label: 'Tekst bovenaan de pagina',
        fields: [
          { kind: 'text', name: 'title', label: 'Titel', max: 120, wide: true },
          { kind: 'textarea', name: 'intro', label: 'Intro', rows: 3, max: 800 },
        ],
      },
      {
        kind: 'group',
        label: 'Aanmeldformulier',
        help: 'Aanmeldingen komen binnen in de Inbox.',
        fields: [
          { kind: 'text', name: 'formTitle', label: 'Titel', max: 120, wide: true },
          { kind: 'textarea', name: 'formIntro', label: 'Intro', rows: 3, max: 800 },
        ],
      },
    ],
  },
  donate: {
    key: 'donate',
    title: 'Doneren',
    description: 'De doneerknop met QR-code en rekeningnummer.',
    previewPath: '/#doneren',
    fields: [
      {
        kind: 'group',
        label: 'Doneerknop',
        fields: [
          { kind: 'toggle', name: 'enabled', label: 'Doneerknop tonen met QR-code', help: 'Kan pas als het rekeningnummer ingevuld is. Staat hij uit, dan is er geen doneerknop op de website.' },
          { kind: 'text', name: 'title', label: 'Titel', max: 120, wide: true },
          { kind: 'textarea', name: 'intro', label: 'Tekst', rows: 3, max: 800 },
          { kind: 'amounts', name: 'amounts', label: 'Voorgestelde bedragen (€)', help: 'Gescheiden door komma’s, bv. 10, 25, 50. Bezoekers kunnen ook zelf een bedrag kiezen.' },
        ],
      },
      {
        kind: 'group',
        label: 'Rekening',
        help: 'De QR-code werkt met elke Belgische bankapp.',
        fields: [
          { kind: 'text', name: 'beneficiary', label: 'Naam op de rekening', max: 70 },
          { kind: 'text', name: 'iban', label: 'Rekeningnummer (IBAN)', placeholder: 'BE00 0000 0000 0000' },
          { kind: 'text', name: 'bic', label: 'BIC (mag leeg)', max: 11 },
          { kind: 'text', name: 'remittance', label: 'Mededeling', max: 140 },
        ],
      },
    ],
  },
  faq: {
    key: 'faq',
    title: 'Veelgestelde vragen',
    description: 'De vragen en antwoorden onderaan de startpagina.',
    previewPath: '/#vragen',
    rootList: true,
    fields: [
      {
        kind: 'list',
        name: 'items',
        label: 'Vragen',
        itemLabel: 'Vraag',
        titleField: 'question',
        addLabel: 'Vraag toevoegen',
        newItem: { question: '', answer: '' },
        fields: [
          { kind: 'text', name: 'question', label: 'Vraag', max: 200, wide: true },
          { kind: 'textarea', name: 'answer', label: 'Antwoord', rows: 4, max: 1500 },
        ],
      },
    ],
  },
  notice: {
    key: 'notice',
    title: 'Mededeling',
    description: 'Een balk bovenaan de startpagina, bv. bij een uitzonderlijke sluiting.',
    previewPath: '/',
    fields: [
      {
        kind: 'group',
        label: 'Mededeling',
        fields: [
          { kind: 'toggle', name: 'enabled', label: 'Mededeling tonen' },
          { kind: 'text', name: 'title', label: 'Titel', placeholder: 'Uitzonderlijk gesloten', max: 120, wide: true },
          { kind: 'textarea', name: 'message', label: 'Tekst', rows: 3, max: 600 },
          { kind: 'date', name: 'until', label: 'Tonen tot en met', help: 'Laat leeg om de mededeling te tonen tot je ze uitzet.' },
        ],
      },
    ],
  },
};


