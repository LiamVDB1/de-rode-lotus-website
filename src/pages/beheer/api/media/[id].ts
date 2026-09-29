import type { APIRoute } from 'astro';
import { z } from 'zod';
import { editors } from '../../../../lib/editor-spec';
import { json, problem, readJson } from '../../../../lib/http';
import { deleteMedia, findMedia, mediaUsage, updateAlt } from '../../../../lib/media';
import { isDocumentKey } from '../../../../lib/schema';

const altSchema = z.object({ alt: z.string().trim().max(200, 'Beschrijving is te lang (max. 200 tekens).') });

export const PATCH: APIRoute = async ({ params, request }) => {
  let body: unknown;
  try {
    body = await readJson(request, 4_000);
  } catch {
    return problem('Ongeldig verzoek.', 400);
  }
  const parsed = altSchema.safeParse(body);
  if (!parsed.success) return problem(parsed.error.issues[0]?.message ?? 'Ongeldige beschrijving.', 422);
  if (!(await updateAlt(params.id ?? '', parsed.data.alt))) return problem('Foto niet gevonden.', 404);
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params }) => {
  const item = await findMedia(params.id ?? '');
  if (!item) return problem('Foto niet gevonden.', 404);

  const usedIn = await mediaUsage(item.path);
  if (usedIn.length) {
    const names = usedIn.map((key) => (isDocumentKey(key) ? editors[key].title : key)).join(', ');
    return problem(`Deze foto wordt nog gebruikt in: ${names}. Haal ze daar eerst weg (en publiceer).`, 409, { usedIn });
  }

  await deleteMedia(item);
  return json({ ok: true });
};
