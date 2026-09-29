import { env } from 'cloudflare:workers';
import uploads from '../data/uploads.json';

export const MAX_UPLOAD_BYTES = 6_000_000;
const MAX_DIMENSION = 6000;

export interface MediaItem {
  id: string;
  path: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
  /** Meegeleverd met de site (public/uploads): niet te verwijderen. */
  builtIn: boolean;
}

interface MediaRow {
  id: string;
  path: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
}

const FORMATS = [
  { type: 'image/webp', ext: 'webp', matches: (b: Uint8Array) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP' },
  { type: 'image/jpeg', ext: 'jpg', matches: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', ext: 'png', matches: (b: Uint8Array) => b[0] === 0x89 && ascii(b, 1, 4) === 'PNG' },
] as const;

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}

/** Bepaalt het type op basis van de inhoud, niet van wat de browser beweert. */
export function sniffImage(bytes: Uint8Array): (typeof FORMATS)[number] | null {
  return FORMATS.find((format) => format.matches(bytes)) ?? null;
}

export function validDimension(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= MAX_DIMENSION ? number : null;
}

const toItem = (row: MediaRow): MediaItem => ({
  id: row.id,
  path: row.path,
  alt: row.alt,
  width: row.width,
  height: row.height,
  bytes: row.bytes,
  createdAt: row.created_at,
  builtIn: false,
});

const builtIn: MediaItem[] = uploads.map((item) => ({ ...item, id: `ingebouwd-${item.path}`, bytes: 0, createdAt: '', builtIn: true }));

export async function listMedia(): Promise<MediaItem[]> {
  const { results } = await env.DB.prepare('SELECT id, path, alt, width, height, bytes, created_at FROM media ORDER BY created_at DESC').all<MediaRow>();
  return [...results.map(toItem), ...builtIn];
}

export async function storeMedia(bytes: Uint8Array, width: number, height: number, alt: string): Promise<MediaItem | null> {
  const format = sniffImage(bytes);
  if (!format) return null;
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  const key = `${id}.${format.ext}`;
  const createdAt = new Date().toISOString();
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: format.type, cacheControl: 'public, max-age=31536000, immutable' } });
  const row: MediaRow = { id, path: `/media/${key}`, alt, width, height, bytes: bytes.byteLength, created_at: createdAt };
  await env.DB.prepare('INSERT INTO media (id, path, alt, width, height, bytes, content_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(row.id, row.path, row.alt, row.width, row.height, row.bytes, format.type, row.created_at)
    .run();
  return toItem(row);
}

export async function updateAlt(id: string, alt: string): Promise<boolean> {
  const result = await env.DB.prepare('UPDATE media SET alt = ? WHERE id = ?').bind(alt, id).run();
  return (result.meta.changes ?? 0) > 0;
}

/** Documenten (werkversie of gepubliceerd) waarin de foto nog gebruikt wordt. */
export async function mediaUsage(path: string): Promise<string[]> {
  const needle = `%${JSON.stringify(path).slice(1, -1)}%`;
  const { results } = await env.DB.prepare('SELECT key FROM documents WHERE draft LIKE ?1 OR published LIKE ?1').bind(needle).all<{ key: string }>();
  return results.map((row) => row.key);
}

export async function findMedia(id: string): Promise<MediaItem | null> {
  const row = await env.DB.prepare('SELECT id, path, alt, width, height, bytes, created_at FROM media WHERE id = ?').bind(id).first<MediaRow>();
  return row ? toItem(row) : null;
}

export async function deleteMedia(item: MediaItem): Promise<void> {
  await env.MEDIA.delete(item.path.replace(/^\/media\//, ''));
  await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(item.id).run();
}
