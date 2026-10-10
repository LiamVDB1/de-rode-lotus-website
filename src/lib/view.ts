import { loadDocuments } from './content';
import type { Lang } from './i18n';
import type { Documents } from './schema';
import { localize } from './translate';

export interface View {
  lang: Lang;
  /** De inhoud in de taal van de pagina. */
  docs: Documents;
  /** De Nederlandse inhoud (bv. voor dagnamen in scripts). */
  source: Documents;
}

export async function loadView(locals: App.Locals, lang: Lang): Promise<View> {
  const source = await loadDocuments(locals.draft ? 'draft' : 'published');
  return { lang, source, docs: await localize(source, lang) };
}
