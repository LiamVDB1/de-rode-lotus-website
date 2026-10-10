import type { APIRoute } from 'astro';
import { z } from 'zod';
import { loadDocuments } from '../../../../lib/content';
import { json, problem, readJson } from '../../../../lib/http';
import { TARGET_LANGS } from '../../../../lib/i18n';
import { collectTexts, MAX_TRANSLATION, retranslate, saveManual } from '../../../../lib/translate';

const bodySchema = z.object({
  lang: z.enum(TARGET_LANGS),
  source: z.string().min(1).max(10_000),
  /** Leeg of weggelaten: opnieuw automatisch vertalen. */
  text: z.string().trim().max(MAX_TRANSLATION, `Vertaling is te lang (max. ${MAX_TRANSLATION} tekens).`).optional(),
});

/** Verbetert één vertaling, of laat ze opnieuw automatisch maken. */
export const PUT: APIRoute = async ({ request }) => {
  let body: z.infer<typeof bodySchema>;
  try {
    const parsed = bodySchema.safeParse(await readJson(request, 64_000));
    if (!parsed.success) return problem(parsed.error.issues[0]?.message ?? 'Ongeldige vertaling.', 422);
    body = parsed.data;
  } catch {
    return problem('Ongeldig verzoek.');
  }

  // Enkel teksten die echt op de website staan.
  const live = await loadDocuments('published');
  if (!collectTexts(live).includes(body.source)) return problem('Deze tekst staat niet (meer) op de website. Herlaad de pagina.', 409);

  if (body.text) {
    await saveManual(body.lang, body.source, body.text);
    return json({ ok: true, text: body.text, origin: 'manual' });
  }
  const text = await retranslate(body.lang, body.source);
  if (!text) return problem('Automatisch vertalen lukte niet. Probeer later opnieuw of vul zelf een vertaling in.', 502);
  return json({ ok: true, text, origin: 'auto' });
};
