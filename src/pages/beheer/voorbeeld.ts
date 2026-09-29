import type { APIRoute } from 'astro';
import { cookieOptions, PREVIEW_COOKIE } from '../../lib/auth';
import { problem, safeLocalPath, sameOrigin } from '../../lib/http';

/** Zet de voorbeeldmodus aan of uit op deze host (op preview.derodelotus.com staat ze altijd aan). */
export const POST: APIRoute = async ({ request, cookies, url, redirect }) => {
  if (!sameOrigin(request)) return problem('Ongeldig verzoek.', 403);
  const form = await request.formData().catch(() => null);
  const on = form?.get('aan') === '1';
  const target = safeLocalPath(String(form?.get('naar') ?? '/'));
  if (on) cookies.set(PREVIEW_COOKIE, '1', cookieOptions(url, 12 * 3600));
  else cookies.delete(PREVIEW_COOKIE, cookieOptions(url, 0));
  return redirect(target, 303);
};
