import type { APIRoute } from 'astro';
import { json, problem } from '../../../../lib/http';
import { listMedia, MAX_UPLOAD_BYTES, storeMedia, validDimension } from '../../../../lib/media';

export const GET: APIRoute = async () => json({ ok: true, items: await listMedia() });

export const POST: APIRoute = async ({ request }) => {
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_UPLOAD_BYTES + 20_000) return problem('Deze foto is te groot.', 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return problem('De foto kon niet gelezen worden.', 400);
  }

  const file = form.get('file');
  const width = validDimension(form.get('width'));
  const height = validDimension(form.get('height'));
  const alt = String(form.get('alt') ?? '').trim().slice(0, 200);
  if (!(file instanceof File) || !width || !height) return problem('De foto kon niet gelezen worden.', 400);
  if (file.size > MAX_UPLOAD_BYTES) return problem('Deze foto is te groot.', 413);

  const item = await storeMedia(new Uint8Array(await file.arrayBuffer()), width, height, alt);
  if (!item) return problem('Dit bestandstype wordt niet ondersteund. Gebruik een JPG, PNG of WebP.', 415);
  return json({ ok: true, item }, 201);
};
