import type { APIRoute } from 'astro';
import { endSession } from '../../lib/auth';
import { problem, sameOrigin } from '../../lib/http';

export const POST: APIRoute = ({ request, cookies, url, redirect }) => {
  if (!sameOrigin(request)) return problem('Ongeldig verzoek.', 403);
  endSession(cookies, url);
  return redirect('/beheer/login', 303);
};
