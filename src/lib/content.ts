import { env } from 'cloudflare:workers';
import activities from '../data/activities.json';
import donate from '../data/donate.json';
import faq from '../data/faq.json';
import home from '../data/home.json';
import notice from '../data/notice.json';
import practical from '../data/practical.json';
import team from '../data/team.json';
import { DOCUMENT_KEYS, documentSchemas, type DocumentKey, type Documents } from './schema';

/** Startinhoud: wordt gebruikt zolang een document nog niet in D1 staat. */
const defaults = { home, practical, activities, team, donate, faq, notice } as unknown as Documents;

export type Mode = 'published' | 'draft';

interface Row {
  key: string;
  draft: string;
  published: string | null;
  updated_at: string;
  published_at: string | null;
}

export interface DocumentStatus {
  key: DocumentKey;
  changed: boolean;
  updatedAt: string | null;
  publishedAt: string | null;
}

function parse<K extends DocumentKey>(key: K, raw: string | null): Documents[K] | null {
  if (!raw) return null;
  try {
    const result = documentSchemas[key].safeParse(JSON.parse(raw));
    if (result.success) return result.data as Documents[K];
    console.error(`Document ${key} in D1 is ongeldig`, result.error.issues);
  } catch (error) {
    console.error(`Document ${key} in D1 is geen geldige JSON`, error);
  }
  return null;
}

async function rows(): Promise<Map<string, Row>> {
  const { results } = await env.DB.prepare('SELECT key, draft, published, updated_at, published_at FROM documents').all<Row>();
  return new Map(results.map((row) => [row.key, row]));
}

/** Alle inhoud voor een pagina. Een document zonder gepubliceerde versie valt terug op de startinhoud. */
export async function loadDocuments(mode: Mode): Promise<Documents> {
  const stored = await rows();
  const entries = DOCUMENT_KEYS.map((key) => {
    const row = stored.get(key);
    const value = (mode === 'draft' ? parse(key, row?.draft ?? null) : null) ?? parse(key, row?.published ?? null) ?? defaults[key];
    return [key, value] as const;
  });
  return Object.fromEntries(entries) as Documents;
}

export async function loadDraft<K extends DocumentKey>(key: K): Promise<Documents[K]> {
  const row = await env.DB.prepare('SELECT draft, published FROM documents WHERE key = ?').bind(key).first<Pick<Row, 'draft' | 'published'>>();
  return parse(key, row?.draft ?? null) ?? parse(key, row?.published ?? null) ?? defaults[key];
}

export async function saveDraft<K extends DocumentKey>(key: K, value: Documents[K]): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO documents (key, draft, published, updated_at) VALUES (?1, ?2, NULL, ?3)
     ON CONFLICT (key) DO UPDATE SET draft = excluded.draft, updated_at = excluded.updated_at`,
  )
    .bind(key, JSON.stringify(value), now)
    .run();
}

/** Zet de werkversie terug naar wat nu live staat. */
export async function discardDraft(key: DocumentKey): Promise<void> {
  const row = await env.DB.prepare('SELECT published FROM documents WHERE key = ?').bind(key).first<Pick<Row, 'published'>>();
  if (row?.published) {
    await env.DB.prepare('UPDATE documents SET draft = published, updated_at = ? WHERE key = ?').bind(new Date().toISOString(), key).run();
  } else {
    await env.DB.prepare('DELETE FROM documents WHERE key = ?').bind(key).run();
  }
}

/** Publiceert alle werkversies in één batch. */
export async function publishAll(): Promise<number> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    'UPDATE documents SET published = draft, published_at = ? WHERE published IS NULL OR published <> draft',
  )
    .bind(now)
    .run();
  return result.meta.changes ?? 0;
}

export async function documentStatuses(): Promise<DocumentStatus[]> {
  const stored = await rows();
  return DOCUMENT_KEYS.map((key) => {
    const row = stored.get(key);
    return {
      key,
      changed: Boolean(row && row.draft !== row.published),
      updatedAt: row?.updated_at ?? null,
      publishedAt: row?.published_at ?? null,
    };
  });
}
