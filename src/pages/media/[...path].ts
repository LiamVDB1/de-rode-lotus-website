import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const KEY_PATTERN = /^[a-zA-Z0-9_-]+\.(?:avif|jpe?g|png|webp)$/;

/** Foto's uit de beheeromgeving. De bestandsnaam is uniek per upload, dus ze mogen lang gecachet worden. */
export const GET: APIRoute = async ({ params, request }) => {
  const key = params.path ?? '';
  if (!KEY_PATTERN.test(key)) return new Response('Niet gevonden', { status: 404 });

  const object = await env.MEDIA.get(key, { onlyIf: request.headers });
  if (!object) return new Response('Niet gevonden', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (!('body' in object)) return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers });
};
