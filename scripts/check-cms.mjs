import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = parse(readFileSync(resolve(root, '.pages.yml'), 'utf8'));
const errors = [];

if (config.media?.input !== 'public/uploads' || config.media?.output !== '/uploads') errors.push('Mediapad in .pages.yml klopt niet.');
if (!Array.isArray(config.content) || config.content.length !== 5) errors.push('Verwacht vijf CMS-onderdelen.');
else for (const entry of config.content) {
  if (entry.type !== 'file' || entry.format !== 'json') errors.push(`${entry.name}: verwacht een JSON-bestand.`);
  if (typeof entry.path !== 'string' || !/^src\/data\/[a-z-]+\.json$/.test(entry.path)) {
    errors.push(`${entry.name}: ongeldig bestandspad.`);
    continue;
  }
  const data = JSON.parse(readFileSync(resolve(root, entry.path), 'utf8'));
  if (Array.isArray(data) !== (entry.list === true)) errors.push(`${entry.name}: lijstinstelling klopt niet met het JSON-bestand.`);
  const keys = Object.keys(Array.isArray(data) ? data[0] ?? {} : data);
  const fields = (entry.fields ?? []).map((field) => field.name);
  const missing = fields.filter((name) => !keys.includes(name));
  const unmanaged = keys.filter((name) => !fields.includes(name));
  if (missing.length) errors.push(`${entry.name}: CMS-velden zonder inhoud: ${missing.join(', ')}.`);
  if (unmanaged.length) errors.push(`${entry.name}: inhoud zonder CMS-veld: ${unmanaged.join(', ')}.`);
}

if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else process.stdout.write('Pages CMS-configuratie gecontroleerd.\n');
