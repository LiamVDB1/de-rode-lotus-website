import type { APIRoute } from 'astro';
import { loadDocuments } from '../../../../lib/content';
import { json } from '../../../../lib/http';
import { translateMissing } from '../../../../lib/translate';

/** Vertaalt alles wat online staat en nog geen vertaling heeft. */
export const POST: APIRoute = async () => json({ ok: true, ...(await translateMissing(await loadDocuments('published'))) });
