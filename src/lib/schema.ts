import { z } from 'zod';

const text = (label: string, max = 400) =>
  z.string().trim().min(1, `${label} ontbreekt.`).max(max, `${label} is te lang (max. ${max} tekens).`);
const optionalText = (max = 400) => z.string().trim().max(max, `Tekst is te lang (max. ${max} tekens).`);

/** Foto's staan in /uploads (meegeleverd) of /media (geüpload via /beheer). Leeg = geen foto. */
export const PHOTO_PATTERN = /^\/(?:uploads|media)\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.(?:avif|jpe?g|png|webp)$/;
const photo = z.string().trim().refine((value) => value === '' || PHOTO_PATTERN.test(value), 'Kies een foto uit de fotobibliotheek.');
const httpsUrl = (host: RegExp, label: string) =>
  z.string().trim().refine((value) => value === '' || host.test(value), `${label} is geen geldige link.`);

export const slugSchema = z
  .string()
  .trim()
  .min(2, 'Webadres is te kort.')
  .max(60, 'Webadres is te lang.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Webadres: enkel kleine letters, cijfers en streepjes.');

const photoItem = z.object({ src: photo.refine((v) => v !== '', 'Kies een foto.'), alt: optionalText(200) });

const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), heading: optionalText(120), text: optionalText(4000) }),
  z.object({ type: z.literal('photos'), heading: optionalText(120), photos: z.array(photoItem).max(200, 'Maximaal 200 foto’s per blok.') }),
]);

export const homeSchema = z.object({
  pageTitle: text('Paginatitel', 120),
  metaDescription: text('Beschrijving voor zoekmachines', 300),
  heroTitle: text('Grote titel', 120),
  heroIntro: text('Intro', 400),
  heroPhoto: photo,
  heroPhotoAlt: optionalText(200),
  servicesTitle: text('Titel activiteiten', 120),
  servicesIntro: text('Intro activiteiten', 600),
  storyTitle: text('Titel ontmoetingsplek', 120),
  storyText: text('Tekst ontmoetingsplek', 1500),
  storyPhoto: photo,
  storyPhotoAlt: optionalText(200),
  catName: optionalText(60),
  catText: optionalText(600),
  catPhoto: photo,
  catPhotoAlt: optionalText(200),
  helpTitle: text('Titel helpen', 120),
  helpIntro: text('Intro helpen', 600),
  faqTitle: text('Titel vragen', 120),
  faqIntro: text('Intro vragen', 600),
});

export const practicalSchema = z.object({
  street: text('Straat', 120),
  postalCode: z.string().trim().regex(/^\d{4}$/, 'Postcode moet 4 cijfers zijn.'),
  city: text('Gemeente', 80),
  neighbourhood: text('Wijk', 80),
  phoneDisplay: text('Telefoonnummer', 30),
  phoneInternational: z.string().trim().regex(/^\+\d{8,15}$/, 'Internationaal telefoonnummer moet +32… zijn.'),
  email: z.email('E-mailadres is ongeldig.'),
  facebookUrl: httpsUrl(/^https:\/\/(www\.)?facebook\.com\/.+$/, 'Facebook-link'),
  instagramUrl: httpsUrl(/^https:\/\/(www\.)?instagram\.com\/.+$/, 'Instagram-link'),
  hoursTitle: text('Titel openingsuren', 120),
  hoursIntro: text('Intro openingsuren', 400),
  hours: z
    .array(z.object({ day: text('Dag', 30), time: text('Uren', 60), activity: text('Wat is er', 300) }))
    .min(1, 'Voeg minstens één openingsdag toe.')
    .max(7, 'Maximaal 7 openingsdagen.'),
});

export const activitySchema = z.object({
  slug: slugSchema,
  title: text('Titel', 80),
  description: text('Korte beschrijving', 400),
  when: optionalText(120),
  photo,
  photoAlt: optionalText(200),
  blocks: z.array(block).max(30, 'Maximaal 30 blokken.'),
});

export const activitiesSchema = z
  .array(activitySchema)
  .min(1, 'Voeg minstens één activiteit toe.')
  .max(20, 'Maximaal 20 activiteiten.')
  .refine((list) => new Set(list.map((item) => item.slug)).size === list.length, 'Elke activiteit heeft een eigen webadres nodig.');

export const teamSchema = z.object({
  title: text('Titel', 120),
  intro: text('Intro', 800),
  members: z
    .array(z.object({ name: text('Naam', 80), role: optionalText(80), photo, photoAlt: optionalText(200), text: optionalText(800) }))
    .max(80, 'Maximaal 80 vrijwilligers.'),
  formTitle: text('Titel formulier', 120),
  formIntro: text('Intro formulier', 800),
});

/** IBAN-controle volgens ISO 13616 (mod 97). */
export function isValidIban(value: string): boolean {
  const iban = value.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const digits = /\d/.test(char) ? char : String(char.charCodeAt(0) - 55);
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

export const donateSchema = z
  .object({
    enabled: z.boolean(),
    title: text('Titel', 120),
    intro: text('Intro', 800),
    beneficiary: text('Naam begunstigde', 70),
    iban: z
      .string()
      .trim()
      .transform((value) => value.replace(/\s+/g, '').toUpperCase())
      .refine((value) => value === '' || isValidIban(value), 'Dit rekeningnummer (IBAN) klopt niet.'),
    bic: z
      .string()
      .trim()
      .toUpperCase()
      .refine((value) => value === '' || /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value), 'BIC is ongeldig.'),
    remittance: optionalText(140),
    amounts: z.array(z.number().int().min(1).max(10000)).max(6, 'Maximaal 6 bedragen.'),
  })
  .refine((value) => !value.enabled || value.iban !== '', { message: 'Vul een rekeningnummer in voor je de knop aanzet.', path: ['iban'] });

export const faqSchema = z
  .array(z.object({ question: text('Vraag', 200), answer: text('Antwoord', 1500) }))
  .max(30, 'Maximaal 30 vragen.');

export const noticeSchema = z
  .object({
    enabled: z.boolean(),
    title: optionalText(120),
    message: optionalText(600),
    until: z.string().trim().refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Einddatum moet JJJJ-MM-DD zijn.'),
  })
  .refine((value) => !value.enabled || (value.title !== '' && value.message !== ''), { message: 'Een zichtbare mededeling heeft een titel en tekst nodig.', path: ['title'] });

export const documentSchemas = {
  home: homeSchema,
  practical: practicalSchema,
  activities: activitiesSchema,
  team: teamSchema,
  donate: donateSchema,
  faq: faqSchema,
  notice: noticeSchema,
} as const;

export type DocumentKey = keyof typeof documentSchemas;
export type Documents = { [K in DocumentKey]: z.infer<(typeof documentSchemas)[K]> };
export type Activity = z.infer<typeof activitySchema>;
export type Block = z.infer<typeof block>;
export const DOCUMENT_KEYS = Object.keys(documentSchemas) as DocumentKey[];

export function isDocumentKey(value: string): value is DocumentKey {
  return Object.hasOwn(documentSchemas, value);
}

/** Zet een zod-fout om naar leesbare meldingen voor de beheerder. */
export function formatIssues(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

/** Aanmelding via het formulier op /vrijwilligers. */
export const volunteerSchema = z.object({
  name: text('Naam', 80),
  email: z.email('Vul een geldig e-mailadres in.').max(200),
  phone: z.string().trim().max(30, 'Telefoonnummer is te lang.').refine((value) => value === '' || /^[+\d][\d\s./-]{5,}$/.test(value), 'Telefoonnummer klopt niet.'),
  availability: optionalText(300),
  message: optionalText(2000),
  consent: z.literal('ja', 'Geef toestemming zodat we je gegevens mogen bewaren.'),
});
export type Volunteer = z.infer<typeof volunteerSchema>;
