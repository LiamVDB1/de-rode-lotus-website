// Blokkeert een publieke (indexeerbare) release zolang De Rode Lotus de site niet heeft goedgekeurd.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publication = JSON.parse(readFileSync(resolve(root, 'src/data/publication.json'), 'utf8'));
const errors = [];

if (publication.approvedByOrganisation !== true) errors.push('De Rode Lotus heeft de inhoud nog niet als publiceerbaar bevestigd.');
if (publication.photoRightsConfirmed !== true) errors.push('De fotorechten zijn nog niet bevestigd.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(publication.approvedOn ?? '')) errors.push('Vul de bevestigingsdatum in bij publication.json.');

if (errors.length) {
  process.stderr.write(`Publicatie geblokkeerd:\n- ${errors.join('\n- ')}\n`);
  process.exitCode = 1;
} else process.stdout.write('Publicatiecontrole geslaagd.\n');
