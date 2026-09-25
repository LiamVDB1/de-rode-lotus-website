import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(readFileSync(resolve(root, 'src/data', `${name}.json`), 'utf8'));
const publication = read('publication');
const home = read('home');
const activities = read('activities');
const errors = [];

if (publication.approvedByOrganisation !== true) errors.push('De Rode Lotus heeft de inhoud nog niet als publiceerbaar bevestigd.');
if (publication.photoRightsConfirmed !== true) errors.push('De fotorechten zijn nog niet bevestigd.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(publication.approvedOn)) errors.push('Vul de bevestigingsdatum in bij publication.json.');

for (const [label, photo] of [['Grote foto', home.heroPhoto], ['Foto ontmoetingsplek', home.storyPhoto], ...activities.map((item, index) => [`Activiteit ${index + 1}`, item.photo])]) {
  if (!/^\/uploads\/[a-zA-Z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/.test(photo ?? '')) {
    errors.push(`${label}: upload een goedgekeurde echte foto via Pages CMS.`);
    continue;
  }
  const localPath = resolve(root, 'public', photo.slice(1));
  if (!localPath.startsWith(resolve(root, 'public/uploads') + '/')) errors.push(`${label}: ongeldig pad.`);
  else if (!existsSync(localPath)) errors.push(`${label}: ${photo} bestaat niet.`);
}

if (errors.length) {
  process.stderr.write(`Publicatie geblokkeerd:\n- ${errors.join('\n- ')}\n`);
  process.exitCode = 1;
} else process.stdout.write('Publicatiecontrole geslaagd.\n');
