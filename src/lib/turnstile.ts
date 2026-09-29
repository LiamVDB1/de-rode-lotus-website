import { env } from 'cloudflare:workers';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
// Officiële testsleutel van Cloudflare: laat elke poging slagen. Enkel voor lokaal en staging.
const TEST_SECRET = '1x0000000000000000000000000000000AA';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
// Vaste token die de testsitesleutel altijd teruggeeft.
const TEST_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

export async function verifyTurnstile(token: string, ip: string, url: URL): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const configured = typeof env.TURNSTILE_SECRET === 'string' && env.TURNSTILE_SECRET ? env.TURNSTILE_SECRET : '';
  // Productie faalt gesloten: zonder echte sleutel wordt niets aanvaard (ook niet via workers.dev).
  // Lokaal (astro dev gebruikt de productie-vars) en op staging volstaat de testsleutel.
  if (!configured && env.COOKIE_DOMAIN && !LOCAL_HOSTS.has(url.hostname)) return false;
  // Lokaal zonder sleutel: geen netwerkoproep nodig (en niet altijd mogelijk vanuit de dev-server).
  if (!configured && LOCAL_HOSTS.has(url.hostname)) return token === TEST_TOKEN;
  const secret = configured || TEST_SECRET;
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error('Turnstile-controle mislukt', error);
    return false;
  }
}
