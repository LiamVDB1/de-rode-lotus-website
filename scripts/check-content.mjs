// Controleert de startinhoud in src/data met dezelfde regels als de beheeromgeving (src/lib/schema.ts).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { documentSchemas, DOCUMENT_KEYS, formatIssues } from '../src/lib/schema.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => JSON.parse(readFileSync(resolve(root, 'src/data', `${name}.json`), 'utf8'));

function collectUploads(value, found = []) {
  if (typeof value === 'string' && value.startsWith('/uploads/')) found.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectUploads(item, found));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectUploads(item, found));
  return found;
}

export function checkContent() {
  const errors = [];
  for (const key of DOCUMENT_KEYS) {
    const data = read(key);
    const result = documentSchemas[key].safeParse(data);
    if (!result.success) formatIssues(result.error).forEach((issue) => errors.push(`${key}${issue.path ? `.${issue.path}` : ''}: ${issue.message}`));
    for (const upload of collectUploads(data)) {
      const localPath = resolve(root, 'public', upload.slice(1));
      if (!localPath.startsWith(resolve(root, 'public/uploads') + '/') || !existsSync(localPath)) errors.push(`${key}: ontbrekende foto ${upload}`);
    }
  }
  // De fotobibliotheek in /beheer toont public/uploads via src/data/uploads.json: die moeten overeenkomen.
  const listed = new Set(JSON.parse(readFileSync(resolve(root, 'src/data/uploads.json'), 'utf8')).map((item) => item.path));
  const present = readdirSync(resolve(root, 'public/uploads')).filter((name) => !name.startsWith('.')).map((name) => `/uploads/${name}`);
  for (const path of present) if (!listed.has(path)) errors.push(`uploads.json: ${path} ontbreekt in de lijst`);
  for (const path of listed) if (!present.includes(path)) errors.push(`uploads.json: ${path} bestaat niet`);
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const found = checkContent();
  if (found.length) {
    process.stderr.write(`${found.join('\n')}\n`);
    process.exitCode = 1;
  } else process.stdout.write('Inhoud gecontroleerd.\n');
}
