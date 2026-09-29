import type { APIRoute } from 'astro';
import { json, problem, readJson } from '../../../../lib/http';
import { deleteSubmission, setStatus, statusSchema } from '../../../../lib/inbox';

export const PATCH: APIRoute = async ({ params, request }) => {
  let body: unknown;
  try {
    body = await readJson(request, 1_000);
  } catch {
    return problem('Ongeldig verzoek.', 400);
  }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return problem('Onbekende status.', 422);
  if (!(await setStatus(params.id ?? '', parsed.data.status))) return problem('Aanmelding niet gevonden.', 404);
  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ params }) => {
  if (!(await deleteSubmission(params.id ?? ''))) return problem('Aanmelding niet gevonden.', 404);
  return json({ ok: true });
};
