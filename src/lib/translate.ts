import { env } from 'cloudflare:workers';
import { TARGET_LANGS, type Lang, type TargetLang } from './i18n';
import { DOCUMENT_KEYS, type DocumentKey, type Documents } from './schema';

/**
 * Vertalingen werken als een vertaalgeheugen: per taal staat bij elke Nederlandse tekst één vertaling.
 * Verandert de Nederlandse tekst, dan hoort er een nieuwe vertaling bij; een verbetering in het beheer
 * blijft staan zolang de Nederlandse tekst dezelfde is.
 */

/** Velden met lopende tekst. Namen, adressen, webadressen, foto's en betaalgegevens blijven zoals ze zijn. */
const TRANSLATABLE = new Set([
  'pageTitle', 'metaDescription', 'heroTitle', 'heroIntro', 'heroPhotoAlt', 'servicesTitle', 'servicesIntro',
  'storyTitle', 'storyText', 'storyPhotoAlt', 'catText', 'catPhotoAlt', 'helpTitle', 'helpIntro', 'faqTitle', 'faqIntro',
  'hoursTitle', 'hoursIntro', 'day', 'time', 'activity',
  'title', 'description', 'when', 'photoAlt', 'heading', 'text', 'alt',
  'intro', 'role', 'formTitle', 'formIntro', 'question', 'answer', 'message',
]);

/** Vergeleken met Llama 3.3 en Gemma 4: het natuurlijkste Frans en het snelst. */
export const MODEL = '@cf/mistralai/mistral-small-3.1-24b-instruct';
const BATCH_TEXTS = 20;
const BATCH_CHARS = 5000;
/** Workers heeft een limiet op het aantal deelverzoeken; wat overblijft, komt bij de volgende keer. */
const MAX_CALLS = 24;
export const MAX_TRANSLATION = 6000;

export type Origin = 'auto' | 'manual';
export interface Memory {
  text: string;
  origin: Origin;
}

function mapStrings(value: unknown, fn: (text: string) => string, key?: string): unknown {
  if (typeof value === 'string') return key && TRANSLATABLE.has(key) && value.trim() !== '' ? fn(value) : value;
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, fn, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, mapStrings(child, fn, childKey)]));
  }
  return value;
}

/** Alle te vertalen teksten in een document, zonder dubbels, in volgorde van voorkomen. */
export function collectTexts(value: unknown): string[] {
  const found = new Set<string>();
  mapStrings(value, (text) => {
    found.add(text);
    return text;
  });
  return [...found];
}

export async function hashText(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest).slice(0, 16)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashAll(texts: Iterable<string>): Promise<Map<string, string>> {
  const unique = [...new Set(texts)];
  const hashes = await Promise.all(unique.map(hashText));
  return new Map(unique.map((text, index) => [text, hashes[index]]));
}

export async function loadMemory(lang: TargetLang): Promise<Map<string, Memory>> {
  const { results } = await env.DB.prepare('SELECT hash, text, origin FROM translations WHERE lang = ?')
    .bind(lang)
    .all<{ hash: string; text: string; origin: Origin }>();
  return new Map(results.map((row) => [row.hash, { text: row.text, origin: row.origin }]));
}

/** De inhoud in een andere taal. Wat nog niet vertaald is, blijft Nederlands. */
export async function localize(docs: Documents, lang: Lang): Promise<Documents> {
  if (lang === 'nl') return docs;
  const [memory, hashes] = await Promise.all([loadMemory(lang), hashAll(collectTexts(docs))]);
  return mapStrings(docs, (text) => memory.get(hashes.get(text) ?? '')?.text ?? text) as Documents;
}

const LANGUAGE_NAMES: Record<TargetLang, string> = { en: 'English (British spelling)', fr: 'French (as used in Belgium)' };

/** Vaste woorden, zodat dezelfde dingen overal hetzelfde heten. */
const GLOSSARY: Record<TargetLang, Record<string, string>> = {
  en: {
    weggeefwinkel: 'free shop', voedselbedeling: 'food distribution', voedselhulp: 'food aid', voedselpakket: 'food parcel',
    doorverwijsbrief: 'referral letter', spelotheek: 'toy library', 'creatief atelier': 'creative workshop',
    naaiatelier: 'sewing workshop', strijkkralen: 'ironing beads', kapster: 'hairdresser', vrijwilliger: 'volunteer',
    'Brugse Poort': 'Brugse Poort (a neighbourhood in Ghent)',
  },
  fr: {
    weggeefwinkel: 'magasin gratuit', voedselbedeling: 'distribution alimentaire', voedselhulp: 'aide alimentaire', voedselpakket: 'colis alimentaire',
    doorverwijsbrief: 'lettre de recommandation', spelotheek: 'ludothèque', 'creatief atelier': 'atelier créatif',
    naaiatelier: 'atelier couture', strijkkralen: 'perles à repasser', kapster: 'coiffeuse', vrijwilliger: 'bénévole',
    'Brugse Poort': 'la Brugse Poort (un quartier de Gand)',
  },
};

export function systemPrompt(lang: TargetLang): string {
  const glossary = Object.entries(GLOSSARY[lang]).map(([dutch, translated]) => `- ${dutch} = ${translated}`).join('\n');
  return [
    'You are a professional translator for the website of De Rode Lotus, a volunteer-run free shop and meeting place in the Brugse Poort neighbourhood of Ghent, Belgium.',
    `Translate every Dutch (Belgian) text in "texts" into natural, grammatically correct ${LANGUAGE_NAMES[lang]}.`,
    'Keep the warm, plain tone and the length. Keep line breaks and blank lines. Do not add, explain or leave out anything.',
    'Keep "De Rode Lotus", names of people and streets unchanged. Copy numbers, phone numbers, e-mail addresses and links exactly.',
    lang === 'fr'
      ? 'Address the reader as "vous". Belgian times like "13u" or "9u30" become "13h" and "9h30". Use French punctuation spacing (a space before ?, !, : and ;).'
      : 'Belgian times use the 24-hour clock: "13u" means 13:00 and "9u30" means 09:30. Write them as "13:00" and "9:30"; never convert to 12-hour times.',
    'Short texts are headings, labels, weekdays or photo descriptions: translate them as such.',
    `Always use these translations:\n${glossary}`,
    'Answer with JSON {"translations": [...]}: exactly one translation per input text, in the same order.',
  ].join('\n');
}

export function extractJson(result: unknown): unknown {
  const record = result as { response?: unknown; choices?: { message?: { content?: unknown } }[] } | null;
  const raw = record?.response ?? record?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string') return raw;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end < start) throw new Error('Geen JSON in het antwoord van het vertaalmodel.');
  // Modellen schrijven soms \' voor een apostrof; dat is geen geldige JSON.
  return JSON.parse(raw.slice(start, end + 1).replace(/\\'/g, "'"));
}

async function translateBatch(texts: string[], lang: TargetLang): Promise<string[]> {
  const result = await env.AI.run(MODEL, {
    messages: [
      { role: 'system', content: systemPrompt(lang) },
      { role: 'user', content: JSON.stringify({ texts }) },
    ],
    max_tokens: 4096,
    temperature: 0.2,
  });
  const translations = (extractJson(result) as { translations?: unknown } | null)?.translations;
  if (!Array.isArray(translations) || translations.length !== texts.length || !translations.every((item) => typeof item === 'string' && item.trim() !== '')) {
    throw new Error(`Onverwacht antwoord van het vertaalmodel (${texts.length} teksten).`);
  }
  return translations.map((item: string) => item.trim().slice(0, MAX_TRANSLATION));
}

function batches(texts: string[]): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const text of texts) {
    if (current.length > 0 && (current.length >= BATCH_TEXTS || size + text.length > BATCH_CHARS)) {
      result.push(current);
      current = [];
      size = 0;
    }
    current.push(text);
    size += text.length;
  }
  if (current.length > 0) result.push(current);
  return result;
}

async function translateGroup(group: string[], lang: TargetLang, budget: { calls: number }, done: Map<string, string>): Promise<void> {
  if (budget.calls <= 0) return;
  budget.calls -= 1;
  try {
    const translated = await translateBatch(group, lang);
    group.forEach((text, index) => done.set(text, translated[index]));
  } catch (error) {
    console.error(`Vertalen naar ${lang} mislukte voor een groep van ${group.length}`, error);
    if (group.length === 1) return;
    // Nog eens tekst per tekst, zodat één lastige tekst de rest niet tegenhoudt.
    for (const text of group) await translateGroup([text], lang, budget, done);
  }
}

/** Vertaalt een lijst in groepen die tegelijk lopen. */
async function translateTexts(texts: string[], lang: TargetLang, budget = { calls: MAX_CALLS }): Promise<Map<string, string>> {
  const done = new Map<string, string>();
  await Promise.all(batches(texts).map((group) => translateGroup(group, lang, budget, done)));
  return done;
}

/** D1 staat maximaal 100 parameters per query toe; 6 per rij. */
const ROWS_PER_INSERT = 16;
const HASHES_PER_DELETE = 90;

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

async function store(lang: TargetLang, rows: { hash: string; source: string; text: string }[], origin: Origin, overwrite: boolean): Promise<void> {
  if (rows.length === 0) return;
  const now = new Date().toISOString();
  const conflict = overwrite
    ? 'DO UPDATE SET source = excluded.source, text = excluded.text, origin = excluded.origin, updated_at = excluded.updated_at'
    : 'DO NOTHING';
  const statements = chunk(rows, ROWS_PER_INSERT).map((part) =>
    env.DB.prepare(`INSERT INTO translations (lang, hash, source, text, origin, updated_at) VALUES ${part.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')} ON CONFLICT (lang, hash) ${conflict}`)
      .bind(...part.flatMap((row) => [lang, row.hash, row.source, row.text, origin, now])),
  );
  await env.DB.batch(statements);
}

export interface TranslateReport {
  translated: number;
  failed: number;
}

/** Vertaalt alle teksten die nog geen vertaling hebben. Bestaande (en verbeterde) vertalingen blijven staan. */
export async function translateMissing(docs: Documents): Promise<TranslateReport> {
  const hashes = await hashAll(collectTexts(docs));
  const budget = { calls: MAX_CALLS };
  const reports = await Promise.all(
    TARGET_LANGS.map(async (lang) => {
      const memory = await loadMemory(lang);
      const missing = [...hashes].filter(([, hash]) => !memory.has(hash)).map(([text]) => text);
      if (missing.length === 0) return { translated: 0, failed: 0 };
      const done = await translateTexts(missing, lang, budget);
      await store(lang, [...done].map(([source, text]) => ({ hash: hashes.get(source) ?? '', source, text })), 'auto', false);
      return { translated: done.size, failed: missing.length - done.size };
    }),
  );
  return reports.reduce((total, report) => ({ translated: total.translated + report.translated, failed: total.failed + report.failed }), { translated: 0, failed: 0 });
}

/** Een verbetering uit het beheer. */
export async function saveManual(lang: TargetLang, source: string, text: string): Promise<void> {
  await store(lang, [{ hash: await hashText(source), source, text }], 'manual', true);
}

/** Gooit een (verbeterde) vertaling weg en laat het model het opnieuw doen. */
export async function retranslate(lang: TargetLang, source: string): Promise<string | null> {
  const done = await translateTexts([source], lang);
  const text = done.get(source);
  if (!text) return null;
  await store(lang, [{ hash: await hashText(source), source, text }], 'auto', true);
  return text;
}

/** Ruimt vertalingen op van teksten die nergens meer voorkomen (niet online en niet in een werkversie). */
export async function pruneUnused(...sets: Documents[]): Promise<void> {
  const hashes = await hashAll(sets.flatMap((docs) => collectTexts(docs)));
  const keep = new Set(hashes.values());
  const { results } = await env.DB.prepare('SELECT DISTINCT hash FROM translations').all<{ hash: string }>();
  const stale = results.map((row) => row.hash).filter((hash) => !keep.has(hash));
  if (stale.length === 0) return;
  await env.DB.batch(chunk(stale, HASHES_PER_DELETE).map((part) => env.DB.prepare(`DELETE FROM translations WHERE hash IN (${part.map(() => '?').join(', ')})`).bind(...part)));
}

export interface ReviewItem {
  hash: string;
  source: string;
  translation: Memory | null;
}

export interface ReviewGroup {
  key: DocumentKey;
  items: ReviewItem[];
}

/** Alle teksten die online staan, per onderdeel, met hun vertaling in één taal. */
export async function reviewList(docs: Documents, lang: TargetLang): Promise<ReviewGroup[]> {
  const [memory, hashes] = await Promise.all([loadMemory(lang), hashAll(collectTexts(docs))]);
  const seen = new Set<string>();
  return DOCUMENT_KEYS.map((key) => {
    const items = collectTexts(docs[key])
      .filter((text) => !seen.has(text) && seen.add(text))
      .map((source) => {
        const hash = hashes.get(source) ?? '';
        return { hash, source, translation: memory.get(hash) ?? null };
      });
    return { key, items };
  }).filter((group) => group.items.length > 0);
}
