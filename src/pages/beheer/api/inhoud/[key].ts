import type { APIRoute } from 'astro';
import { discardDraft, hasUnpublishedChanges, loadDraft, saveDraft } from '../../../../lib/content';
import { json, problem, readJson } from '../../../../lib/http';
import { documentSchemas, formatIssues, isDocumentKey } from '../../../../lib/schema';

// Toegang (ingelogd + zelfde origin) wordt in src/middleware.ts gecontroleerd.

export const GET: APIRoute = async ({ params }) => {
  const key = params.key ?? '';
  if (!isDocumentKey(key)) return problem('Onbekend onderdeel.', 404);
  return json({ ok: true, value: await loadDraft(key) });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const key = params.key ?? '';
  if (!isDocumentKey(key)) return problem('Onbekend onderdeel.', 404);

  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return problem('De wijzigingen konden niet gelezen worden.', 400);
  }

  const parsed = documentSchemas[key].safeParse(body);
  if (!parsed.success) return problem('Niet opgeslagen: kijk de gemarkeerde velden na.', 422, { issues: formatIssues(parsed.error) });

  await saveDraft(key, parsed.data);
  return json({ ok: true, value: parsed.data, changed: await hasUnpublishedChanges(key) });
};

export const DELETE: APIRoute = async ({ params }) => {
  const key = params.key ?? '';
  if (!isDocumentKey(key)) return problem('Onbekend onderdeel.', 404);
  await discardDraft(key);
  return json({ ok: true, value: await loadDraft(key) });
};
