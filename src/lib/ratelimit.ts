import { env } from 'cloudflare:workers';

export interface Limit {
  bucket: string;
  max: number;
  windowSeconds: number;
}

/** Telt gebeurtenissen per bucket in D1. Geeft true terug als er nog ruimte is. */
export async function underLimit(limits: Limit[], now = Date.now()): Promise<boolean> {
  const seconds = Math.floor(now / 1000);
  for (const limit of limits) {
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM rate_events WHERE bucket = ? AND at > ?')
      .bind(limit.bucket, seconds - limit.windowSeconds)
      .first<{ n: number }>();
    if ((row?.n ?? 0) >= limit.max) return false;
  }
  return true;
}

/**
 * Telt de poging eerst en kijkt dan pas of ze binnen de grenzen valt. Zo tellen gelijktijdige
 * verzoeken ook mee, in plaats van allemaal tegelijk de controle te passeren.
 */
export async function consume(limits: Limit[], now = Date.now()): Promise<boolean> {
  await recordEvent(limits.map((limit) => limit.bucket), now);
  return underLimit(limits.map((limit) => ({ ...limit, max: limit.max + 1 })), now);
}

/** IPv6-adressen per /64 groeperen: één aansluiting krijgt er doorgaans een heel blok van. */
export function ipScope(ip: string): string {
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right] : left;
  return `${groups.slice(0, 4).map((group) => group || '0').join(':')}::/64`;
}

export async function recordEvent(buckets: string[], now = Date.now()): Promise<void> {
  const seconds = Math.floor(now / 1000);
  await env.DB.batch([
    ...buckets.map((bucket) => env.DB.prepare('INSERT INTO rate_events (bucket, at) VALUES (?, ?)').bind(bucket, seconds)),
    // Oude tellers opruimen: niets ouder dan een dag is nog nodig.
    env.DB.prepare('DELETE FROM rate_events WHERE at < ?').bind(seconds - 86400),
  ]);
}
