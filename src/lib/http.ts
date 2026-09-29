import { env } from 'cloudflare:workers';

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function problem(message: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return json({ ok: false, message, ...extra }, status);
}

/** Wijzigende verzoeken moeten van dezelfde site komen (bovenop SameSite-cookies). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  const url = new URL(request.url);
  return origin === url.origin;
}

export async function readJson(request: Request, maxBytes = 512_000): Promise<unknown> {
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > maxBytes) throw new Error('Te groot verzoek.');
  const body = await request.text();
  if (body.length > maxBytes) throw new Error('Te groot verzoek.');
  return JSON.parse(body);
}

export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? '127.0.0.1';
}

export function isProductionHost(url: URL): boolean {
  return typeof env.COOKIE_DOMAIN === 'string' && env.COOKIE_DOMAIN !== '' && url.hostname.endsWith(env.COOKIE_DOMAIN);
}

/** Hosts waarnaar we na het inloggen mogen terugsturen: dezelfde site of haar preview. */
function trustedHosts(url: URL): Set<string> {
  const domain = typeof env.COOKIE_DOMAIN === 'string' ? env.COOKIE_DOMAIN : '';
  if (domain && url.hostname.endsWith(domain)) return new Set([domain, `www.${domain}`, `preview.${domain}`]);
  return new Set([url.hostname]);
}

/** Voorkomt een open redirect: enkel eigen hosts en paden, anders naar /beheer. */
export function safeReturnUrl(raw: string | null, url: URL): string {
  const fallback = new URL('/beheer', url).toString();
  if (!raw) return fallback;
  let target: URL;
  try {
    target = new URL(raw, url);
  } catch {
    return fallback;
  }
  if (target.protocol !== url.protocol || target.port !== url.port || !trustedHosts(url).has(target.hostname)) return fallback;
  if (target.pathname.startsWith('/beheer/login') || target.username || target.password) return fallback;
  return target.toString();
}

/** Een lokaal pad (geen //andere-site of schema). */
export function safeLocalPath(raw: string | null): string {
  return raw && /^\/(?![/\\])[^\s]*$/.test(raw) ? raw : '/';
}
