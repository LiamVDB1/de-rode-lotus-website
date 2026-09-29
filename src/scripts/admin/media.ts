import { api } from './api';

export interface MediaItem {
  id: string;
  path: string;
  alt: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
  builtIn: boolean;
}

const MAX_SIDE = 2000;
const MAX_INPUT_BYTES = 40_000_000;
let cache: MediaItem[] | null = null;

export async function loadMedia(force = false): Promise<MediaItem[]> {
  if (cache && !force) return cache;
  const result = await api<{ items: MediaItem[] }>('GET', '/beheer/api/media');
  cache = result.ok ? result.items : [];
  return cache;
}

export function forgetMedia(): void {
  cache = null;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Verkleint de foto in de browser (max. 2000 px) en zet ze om naar WebP, of JPEG als dat niet kan. */
export async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (file.size > MAX_INPUT_BYTES) throw new Error(`${file.name} is te groot (max. 40 MB).`);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`${file.name} kon niet geopend worden. Gebruik een JPG, PNG of WebP.`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Je browser kan deze foto niet verwerken.');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await toBlob(canvas, 'image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.85);
  if (!blob) throw new Error(`${file.name} kon niet omgezet worden.`);
  return { blob, width, height };
}

export interface UploadProgress {
  done: number;
  total: number;
  failed: string[];
}

/** Uploadt foto's één voor één. Mislukte bestanden worden overgeslagen en gemeld. */
export async function uploadFiles(files: File[], onProgress: (progress: UploadProgress) => void): Promise<{ items: MediaItem[]; failed: string[] }> {
  const items: MediaItem[] = [];
  const failed: string[] = [];
  onProgress({ done: 0, total: files.length, failed });
  for (const [index, file] of files.entries()) {
    try {
      const { blob, width, height } = await prepareImage(file);
      const form = new FormData();
      const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';
      form.set('file', blob, `foto.${extension}`);
      form.set('width', String(width));
      form.set('height', String(height));
      form.set('alt', '');
      const result = await api<{ item: MediaItem }>('POST', '/beheer/api/media', form, { quiet: true });
      if (result.ok) items.push(result.item);
      else failed.push(`${file.name}: ${result.message}`);
    } catch (error) {
      failed.push(error instanceof Error ? error.message : `${file.name} kon niet geüpload worden.`);
    }
    onProgress({ done: index + 1, total: files.length, failed });
  }
  if (items.length) cache = cache ? [...[...items].reverse(), ...cache] : null;
  return { items, failed };
}

/** Bestanden uit een drop-event of file input, enkel afbeeldingen. */
export function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|avif)$/i.test(file.name));
}
