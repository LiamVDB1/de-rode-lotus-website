import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(readFileSync(resolve(root, 'src/data', `${name}.json`), 'utf8'));
const errors = [];
const requiredText = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '') errors.push(`${label} ontbreekt.`);
};
const photoPath = (value, label) => {
  if (typeof value !== 'string') return errors.push(`${label} moet tekst zijn.`);
  if (value && !/^\/uploads\/[a-zA-Z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/.test(value)) {
    errors.push(`${label} moet een upload onder /uploads/ zijn.`);
  } else if (value && !existsSync(resolve(root, 'public', value.slice(1)))) {
    errors.push(`${label} verwijst naar een ontbrekend bestand: ${value}.`);
  }
};

export function checkContent() {
  const home = read('home');
  const practical = read('practical');
  const activities = read('activities');
  const faq = read('faq');
  const notice = read('notice');

  for (const key of ['pageTitle', 'metaDescription', 'heroTitle', 'heroIntro', 'heroPhotoAlt', 'servicesTitle', 'servicesIntro', 'storyTitle', 'storyText', 'storyPhotoAlt', 'helpTitle', 'helpIntro', 'faqTitle', 'faqIntro']) requiredText(home[key], `Startpagina: ${key}`);
  photoPath(home.heroPhoto, 'Grote foto');
  photoPath(home.storyPhoto, 'Foto ontmoetingsplek');

  for (const key of ['street', 'postalCode', 'city', 'neighbourhood', 'phoneDisplay', 'phoneInternational', 'email', 'hoursTitle', 'hoursIntro']) requiredText(practical[key], `Praktisch: ${key}`);
  if (!/^\+[0-9]{8,15}$/.test(practical.phoneInternational)) errors.push('Internationaal telefoonnummer moet +32… zijn.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(practical.email)) errors.push('E-mailadres is ongeldig.');
  if (!Array.isArray(practical.hours) || practical.hours.length < 1 || practical.hours.length > 7) errors.push('Er moeten 1 tot 7 openingsdagen zijn.');
  else practical.hours.forEach((item, index) => ['day', 'time', 'activity'].forEach((key) => requiredText(item[key], `Openingsdag ${index + 1}: ${key}`)));

  if (!Array.isArray(activities) || activities.length < 1) errors.push('Voeg minstens één activiteit toe.');
  else activities.forEach((activity, index) => {
    for (const key of ['title', 'description', 'photoAlt', 'linkText']) requiredText(activity[key], `Activiteit ${index + 1}: ${key}`);
    photoPath(activity.photo, `Activiteit ${index + 1}: foto`);
    if (!['faq', 'practical', 'email'].includes(activity.linkTarget)) errors.push(`Activiteit ${index + 1}: kies een geldig linkdoel.`);
    if (index > 3 && !activity.photo) errors.push(`Activiteit ${index + 1}: upload een foto.`);
  });

  if (!Array.isArray(faq)) errors.push('Veelgestelde vragen moeten een lijst zijn.');
  else faq.forEach((item, index) => {
    requiredText(item.question, `Vraag ${index + 1}`);
    requiredText(item.answer, `Antwoord ${index + 1}`);
  });

  if (typeof notice.enabled !== 'boolean') errors.push('Mededeling: enabled moet aan of uit zijn.');
  if (notice.enabled) {
    requiredText(notice.title, 'Mededeling: titel');
    requiredText(notice.message, 'Mededeling: tekst');
  }
  if (notice.until && !/^\d{4}-\d{2}-\d{2}$/.test(notice.until)) errors.push('Mededeling: einddatum moet JJJJ-MM-DD zijn.');
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const found = checkContent();
  if (found.length) {
    process.stderr.write(`${found.join('\n')}\n`);
    process.exitCode = 1;
  } else process.stdout.write('Inhoud gecontroleerd.\n');
}
