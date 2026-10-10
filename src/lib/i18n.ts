/** Talen van de publieke site. Nederlands is de brontaal; Engels en Frans worden vertaald. */
export const LANGS = ['nl', 'en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];
export const TARGET_LANGS = ['en', 'fr'] as const;
export type TargetLang = (typeof TARGET_LANGS)[number];

export const LANG_NAMES: Record<Lang, string> = { nl: 'Nederlands', en: 'English', fr: 'Français' };
export const TARGET_LANG_LABELS: Record<TargetLang, string> = { en: 'Engels', fr: 'Frans' };

export function isTargetLang(value: unknown): value is TargetLang {
  return value === 'en' || value === 'fr';
}

export type Page = { page: 'home' } | { page: 'volunteers' } | { page: 'activity'; slug: string } | { page: 'notFound' };

const PREFIX: Record<Lang, string> = { nl: '', en: '/en', fr: '/fr' };
const SEGMENTS: Record<Lang, { volunteers: string; activities: string }> = {
  nl: { volunteers: 'vrijwilligers', activities: 'activiteiten' },
  en: { volunteers: 'volunteers', activities: 'activities' },
  fr: { volunteers: 'benevoles', activities: 'activites' },
};

/** Pad van een pagina in een taal. Activiteiten houden hun Nederlandse webadres. */
export function pathFor(lang: Lang, target: Page): string {
  const prefix = PREFIX[lang];
  switch (target.page) {
    case 'volunteers':
      return `${prefix}/${SEGMENTS[lang].volunteers}`;
    case 'activity':
      return `${prefix}/${SEGMENTS[lang].activities}/${target.slug}`;
    default:
      return prefix || '/';
  }
}

export function langFromPath(pathname: string): Lang {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  if (pathname === '/fr' || pathname.startsWith('/fr/')) return 'fr';
  return 'nl';
}

const LOCALES: Record<Lang, string> = { nl: 'nl-BE', en: 'en-GB', fr: 'fr-BE' };
export const locale = (lang: Lang) => LOCALES[lang];

const nl = {
  skipLink: 'Ga naar de inhoud',
  homeLabel: 'De Rode Lotus, naar de startpagina',
  mainNav: 'Hoofdnavigatie',
  mainMenu: 'Hoofdmenu',
  navServices: 'Wat we doen',
  navPractical: 'Praktisch',
  navVolunteers: 'Vrijwilligers',
  navFaq: 'Vragen',
  navDonate: 'Doneer',
  navContact: 'Contact',
  menuOpen: 'Menu openen',
  menuClose: 'Menu sluiten',
  languages: 'Taal',
  draftBar: 'je ziet ook wijzigingen die nog niet gepubliceerd zijn.',
  draftLabel: 'Voorbeeld',
  draftBack: 'Terug naar beheer',
  draftOff: 'Voorbeeld uitzetten',
  footerGift: 'Doe een gift',
  footerTagline: 'vzw De Rode Lotus · Weggeefwinkel en ontmoetingsplek in de Brugse Poort',
  ctaPractical: 'Ik zoek praktische info',
  ctaHelp: 'Ik wil helpen',
  quickLabel: 'Praktische informatie',
  route: 'Bekijk route',
  hoursHeading: 'Openingsuren',
  allHours: 'Bekijk alle uren',
  askUs: 'Vraag het ons',
  noticeLabel: 'Actuele mededeling',
  noticeClose: 'Mededeling sluiten',
  moreAbout: 'Meer over',
  facebookClosed: 'Uitzonderlijk gesloten? Dat lees je eerst op onze Facebook-pagina.',
  meetTeam: 'Maak kennis met ons team',
  catEyebrow: 'Onze huiskat',
  catHeading: 'Maak kennis met {name}.',
  catRole: 'Huiskat en officieus hoofd onthaal',
  helpVolunteer: 'Ik wil vrijwilliger worden',
  helpBring: 'Ik wil iets brengen',
  helpDonate: 'Ik wil een gift doen',
  helpQuestion: 'Ik heb eerst een vraag',
  today: 'Vandaag',
  volunteersLabel: 'Vrijwilligers',
  formName: 'Naam',
  formEmail: 'E-mail',
  formPhone: 'Telefoon',
  formOptional: '(niet verplicht)',
  formWhen: 'Wanneer kan je?',
  formWhenPlaceholder: 'Bv. dinsdagvoormiddag of af en toe op zaterdag',
  formWhat: 'Wat wil je graag doen?',
  formConsent: 'Ik geef De Rode Lotus toestemming om mijn gegevens te bewaren om contact met mij op te nemen over vrijwilligerswerk. Je kunt ze altijd laten verwijderen via',
  formSubmit: 'Verstuur aanmelding',
  formWait: 'Even geduld…',
  formThanks: 'Bedankt!',
  formDone: 'We hebben je aanmelding goed ontvangen en nemen snel contact met je op.',
  formOffline: 'Versturen lukte niet. Controleer je verbinding of bel ons.',
  privacySubject: 'Mijn gegevens verwijderen',
  allActivities: '← Alle activiteiten',
  call: 'Bel',
  askQuestion: 'Stel een vraag',
  questionAbout: 'Vraag over {title}',
  photosOf: "Foto's {title}",
  moreActivities: 'Ook bij De Rode Lotus',
  photo: 'Foto',
  close: 'Sluiten',
  prevPhoto: 'Vorige foto',
  nextPhoto: 'Volgende foto',
  donateAmount: 'Kies een bedrag',
  donateOther: 'Ander bedrag',
  donateScan: 'Scan met je bankapp',
  donateIban: 'Rekeningnummer',
  donateBeneficiary: 'Op naam van',
  donateReference: 'Mededeling',
  copy: 'Kopieer',
  copied: 'Gekopieerd',
  copyManual: 'Selecteer en kopieer',
  notFoundTitle: 'Pagina niet gevonden',
  notFoundDescription: 'Deze pagina bestaat niet (meer).',
  notFoundHeading: 'Deze pagina vinden we niet.',
  notFoundText: 'Misschien is ze verhuisd of bestaat ze niet meer.',
  notFoundHome: 'Naar de startpagina',
};

export type Strings = typeof nl;

const en: Strings = {
  skipLink: 'Skip to content',
  homeLabel: 'De Rode Lotus, go to the home page',
  mainNav: 'Main navigation',
  mainMenu: 'Main menu',
  navServices: 'What we do',
  navPractical: 'Practical info',
  navVolunteers: 'Volunteers',
  navFaq: 'Questions',
  navDonate: 'Donate',
  navContact: 'Contact',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
  languages: 'Language',
  draftBar: 'you are also seeing changes that have not been published yet.',
  draftLabel: 'Preview',
  draftBack: 'Back to admin',
  draftOff: 'Turn off preview',
  footerGift: 'Make a donation',
  footerTagline: 'De Rode Lotus non-profit · Free shop and meeting place in Brugse Poort, Ghent',
  ctaPractical: 'I need practical info',
  ctaHelp: 'I want to help',
  quickLabel: 'Practical information',
  route: 'Get directions',
  hoursHeading: 'Opening hours',
  allHours: 'See all opening hours',
  askUs: 'Ask us',
  noticeLabel: 'Current announcement',
  noticeClose: 'Close announcement',
  moreAbout: 'More about',
  facebookClosed: 'Closed unexpectedly? You will read it on our Facebook page first.',
  meetTeam: 'Meet our team',
  catEyebrow: 'Our resident cat',
  catHeading: 'Meet {name}.',
  catRole: 'Resident cat and unofficial head of reception',
  helpVolunteer: 'I want to volunteer',
  helpBring: 'I want to bring something',
  helpDonate: 'I want to make a donation',
  helpQuestion: 'I have a question first',
  today: 'Today',
  volunteersLabel: 'Volunteers',
  formName: 'Name',
  formEmail: 'Email',
  formPhone: 'Phone',
  formOptional: '(optional)',
  formWhen: 'When are you available?',
  formWhenPlaceholder: 'E.g. Tuesday mornings or the occasional Saturday',
  formWhat: 'What would you like to do?',
  formConsent: 'I allow De Rode Lotus to keep my details in order to contact me about volunteering. You can always have them deleted via',
  formSubmit: 'Send application',
  formWait: 'One moment…',
  formThanks: 'Thank you!',
  formDone: 'We have received your application and will get in touch soon.',
  formOffline: 'Sending failed. Check your connection or give us a call.',
  privacySubject: 'Delete my details',
  allActivities: '← All activities',
  call: 'Call',
  askQuestion: 'Ask a question',
  questionAbout: 'Question about {title}',
  photosOf: 'Photos: {title}',
  moreActivities: 'Also at De Rode Lotus',
  photo: 'Photo',
  close: 'Close',
  prevPhoto: 'Previous photo',
  nextPhoto: 'Next photo',
  donateAmount: 'Choose an amount',
  donateOther: 'Other amount',
  donateScan: 'Scan with your banking app',
  donateIban: 'Account number',
  donateBeneficiary: 'Account holder',
  donateReference: 'Reference',
  copy: 'Copy',
  copied: 'Copied',
  copyManual: 'Select and copy',
  notFoundTitle: 'Page not found',
  notFoundDescription: 'This page does not exist (anymore).',
  notFoundHeading: 'We cannot find this page.',
  notFoundText: 'It may have moved or no longer exist.',
  notFoundHome: 'Go to the home page',
};

const fr: Strings = {
  skipLink: 'Aller au contenu',
  homeLabel: 'De Rode Lotus, aller à la page d’accueil',
  mainNav: 'Navigation principale',
  mainMenu: 'Menu principal',
  navServices: 'Nos activités',
  navPractical: 'Infos pratiques',
  navVolunteers: 'Bénévoles',
  navFaq: 'Questions',
  navDonate: 'Faire un don',
  navContact: 'Contact',
  menuOpen: 'Ouvrir le menu',
  menuClose: 'Fermer le menu',
  languages: 'Langue',
  draftBar: 'vous voyez aussi des modifications qui ne sont pas encore publiées.',
  draftLabel: 'Aperçu',
  draftBack: 'Retour à la gestion',
  draftOff: 'Désactiver l’aperçu',
  footerGift: 'Faire un don',
  footerTagline: 'asbl De Rode Lotus · Magasin gratuit et lieu de rencontre dans le quartier Brugse Poort à Gand',
  ctaPractical: 'Je cherche des infos pratiques',
  ctaHelp: 'Je veux aider',
  quickLabel: 'Informations pratiques',
  route: 'Voir l’itinéraire',
  hoursHeading: 'Heures d’ouverture',
  allHours: 'Voir tous les horaires',
  askUs: 'Contactez-nous',
  noticeLabel: 'Annonce',
  noticeClose: 'Fermer l’annonce',
  moreAbout: 'En savoir plus :',
  facebookClosed: 'Fermeture exceptionnelle ? Vous le lirez d’abord sur notre page Facebook.',
  meetTeam: 'Découvrez notre équipe',
  catEyebrow: 'Notre chat',
  catHeading: 'Voici {name}.',
  catRole: 'Chat de la maison et responsable officieux de l’accueil',
  helpVolunteer: 'Je veux devenir bénévole',
  helpBring: 'Je veux apporter quelque chose',
  helpDonate: 'Je veux faire un don',
  helpQuestion: 'J’ai d’abord une question',
  today: 'Aujourd’hui',
  volunteersLabel: 'Bénévoles',
  formName: 'Nom',
  formEmail: 'E-mail',
  formPhone: 'Téléphone',
  formOptional: '(facultatif)',
  formWhen: 'Quand êtes-vous disponible ?',
  formWhenPlaceholder: 'Par ex. le mardi matin ou un samedi de temps en temps',
  formWhat: 'Qu’aimeriez-vous faire ?',
  formConsent: 'J’autorise De Rode Lotus à conserver mes données pour me contacter au sujet du bénévolat. Vous pouvez toujours les faire supprimer via',
  formSubmit: 'Envoyer ma candidature',
  formWait: 'Un instant…',
  formThanks: 'Merci !',
  formDone: 'Nous avons bien reçu votre candidature et nous vous contacterons rapidement.',
  formOffline: 'L’envoi a échoué. Vérifiez votre connexion ou appelez-nous.',
  privacySubject: 'Supprimer mes données',
  allActivities: '← Toutes les activités',
  call: 'Appeler le',
  askQuestion: 'Poser une question',
  questionAbout: 'Question sur {title}',
  photosOf: 'Photos : {title}',
  moreActivities: 'Aussi chez De Rode Lotus',
  photo: 'Photo',
  close: 'Fermer',
  prevPhoto: 'Photo précédente',
  nextPhoto: 'Photo suivante',
  donateAmount: 'Choisissez un montant',
  donateOther: 'Autre montant',
  donateScan: 'Scannez avec votre application bancaire',
  donateIban: 'Numéro de compte',
  donateBeneficiary: 'Au nom de',
  donateReference: 'Communication',
  copy: 'Copier',
  copied: 'Copié',
  copyManual: 'Sélectionnez et copiez',
  notFoundTitle: 'Page introuvable',
  notFoundDescription: 'Cette page n’existe pas (ou plus).',
  notFoundHeading: 'Nous ne trouvons pas cette page.',
  notFoundText: 'Elle a peut-être été déplacée ou n’existe plus.',
  notFoundHome: 'Retour à l’accueil',
};

const STRINGS: Record<Lang, Strings> = { nl, en, fr };

export function strings(lang: Lang): Strings {
  return STRINGS[lang];
}

/** Vult {naam}-plaatshouders in. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** "maandag, dinsdag en vrijdag" in de juiste taal. */
export function listJoin(lang: Lang, items: string[]): string {
  return new Intl.ListFormat(locale(lang), { style: 'long', type: 'conjunction' }).format(items);
}

/** Meldingen van het vrijwilligersformulier (de API antwoordt in de taal van de pagina). */
const formMessages: Record<Lang, Record<string, string>> = {
  nl: {
    invalid: 'Ongeldig verzoek.',
    tooLong: 'Je bericht is te lang.',
    badForm: 'Ongeldig formulier.',
    rateLimited: 'Er kwamen te veel aanmeldingen binnen. Probeer het later opnieuw of bel ons.',
    checkFields: 'Kijk de gemarkeerde velden na.',
    spam: 'De controle tegen spam lukte niet. Probeer opnieuw.',
  },
  en: {
    invalid: 'Invalid request.',
    tooLong: 'Your message is too long.',
    badForm: 'Invalid form.',
    rateLimited: 'We received too many applications. Please try again later or give us a call.',
    checkFields: 'Please check the highlighted fields.',
    spam: 'The spam check failed. Please try again.',
    name: 'Please fill in your name.',
    email: 'Please fill in a valid email address.',
    phone: 'This phone number does not look right.',
    availability: 'This answer is too long.',
    message: 'Your message is too long.',
    consent: 'Please give permission so we can keep your details.',
  },
  fr: {
    invalid: 'Requête invalide.',
    tooLong: 'Votre message est trop long.',
    badForm: 'Formulaire invalide.',
    rateLimited: 'Nous avons reçu trop de candidatures. Réessayez plus tard ou appelez-nous.',
    checkFields: 'Vérifiez les champs indiqués.',
    spam: 'La vérification anti-spam a échoué. Veuillez réessayer.',
    name: 'Indiquez votre nom.',
    email: 'Indiquez une adresse e-mail valide.',
    phone: 'Ce numéro de téléphone ne semble pas correct.',
    availability: 'Cette réponse est trop longue.',
    message: 'Votre message est trop long.',
    consent: 'Donnez votre accord pour que nous puissions conserver vos données.',
  },
};

export function formMessage(lang: Lang, key: string): string {
  return formMessages[lang][key] ?? formMessages.nl[key] ?? '';
}

/** Veldmelding: Nederlands komt rechtstreeks uit de validatie, de andere talen per veld. */
export function fieldMessage(lang: Lang, path: string, dutch: string): string {
  return lang === 'nl' ? dutch : (formMessages[lang][path] ?? dutch);
}
