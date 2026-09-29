import { PHOTO_PATTERN } from './schema';

export function hasPhoto(path: string | undefined): path is string {
  return typeof path === 'string' && PHOTO_PATTERN.test(path);
}

export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function routeHref(street: string, postalCode: string, city: string): string {
  const address = `${street}, ${postalCode} ${city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Tekst met lege regels wordt opgesplitst in alinea's (geen HTML uit de CMS). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Datum van vandaag in Brussel, als JJJJ-MM-DD. */
export function todayInBrussels(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(now);
}
