import { defineMiddleware } from 'astro:middleware';
import { PREVIEW_COOKIE, SESSION_COOKIE, verifySessionToken } from './lib/auth';
import { isIndexableHost, isProductionHost, sameOrigin } from './lib/http';

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' };
const PUBLIC_ADMIN_PATHS = new Set(['/beheer/login', '/beheer/login/']);

const baseHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const publicCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  // Turnstile start een blob-worker in onze origin.
  "worker-src 'self' blob:",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const adminCsp = publicCsp.replace("img-src 'self' data:", "img-src 'self' data: blob:");

function withHeaders(response: Response, headers: Record<string, string>): Response {
  // Redirects en sommige responses hebben onveranderbare headers; kopieer dan.
  try {
    for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
    return response;
  } catch {
    const copy = new Response(response.body, response);
    for (const [name, value] of Object.entries(headers)) copy.headers.set(name, value);
    return copy;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  if (url.protocol === 'http:' && isProductionHost(url)) {
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  const admin = await verifySessionToken(context.cookies.get(SESSION_COOKIE)?.value);
  const previewHost = url.hostname.startsWith('preview.');
  context.locals.admin = admin;
  context.locals.draft = admin && (previewHost || context.cookies.get(PREVIEW_COOKIE)?.value === '1');

  const isAdminPath = url.pathname === '/beheer' || url.pathname.startsWith('/beheer/');
  const needsLogin = (previewHost && !admin) || (isAdminPath && !admin && !PUBLIC_ADMIN_PATHS.has(url.pathname));
  if (needsLogin) {
    if (url.pathname.startsWith('/beheer/api/')) {
      return withHeaders(new Response(JSON.stringify({ ok: false, message: 'Log opnieuw in.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }), { ...baseHeaders, ...NOINDEX });
    }
    // Inloggen gebeurt altijd op het hoofddomein; het cookie geldt ook voor preview.
    const target = new URL('/beheer/login', url.origin.replace('//preview.', '//'));
    target.searchParams.set('terug', url.toString());
    return Response.redirect(target.toString(), 303);
  }

  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(context.request.method);
  if (url.pathname.startsWith('/beheer/api/') && mutating && !sameOrigin(context.request)) {
    return withHeaders(new Response(JSON.stringify({ ok: false, message: 'Ongeldig verzoek.' }), { status: 403, headers: { 'Content-Type': 'application/json' } }), { ...baseHeaders, ...NOINDEX });
  }

  const response = await next();
  const privateResponse = isAdminPath || context.locals.draft;
  return withHeaders(response, {
    ...baseHeaders,
    ...(privateResponse || !isIndexableHost(url) ? NOINDEX : {}),
    'Content-Security-Policy': isAdminPath ? adminCsp : publicCsp,
    ...(privateResponse ? { 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' } : {}),
  });
});
