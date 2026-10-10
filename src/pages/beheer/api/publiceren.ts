import type { APIRoute } from 'astro';
import { loadDocuments, publishAll } from '../../../lib/content';
import { json } from '../../../lib/http';
import { pruneUnused, translateMissing, type TranslateReport } from '../../../lib/translate';

/** Publiceert alles en vertaalt daarna de nieuwe teksten. Lukt het vertalen niet, dan staat de site toch online. */
export const POST: APIRoute = async () => {
  const published = await publishAll();
  let translation: TranslateReport = { translated: 0, failed: 0 };
  try {
    const [live, draft] = await Promise.all([loadDocuments('published'), loadDocuments('draft')]);
    translation = await translateMissing(live);
    await pruneUnused(live, draft);
  } catch (error) {
    console.error('Vertalen na publiceren mislukte', error);
    translation = { translated: 0, failed: -1 };
  }
  return json({ ok: true, published, ...translation });
};
