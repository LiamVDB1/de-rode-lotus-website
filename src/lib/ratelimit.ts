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

export async function recordEvent(buckets: string[], now = Date.now()): Promise<void> {
  const seconds = Math.floor(now / 1000);
  await env.DB.batch([
    ...buckets.map((bucket) => env.DB.prepare('INSERT INTO rate_events (bucket, at) VALUES (?, ?)').bind(bucket, seconds)),
    // Oude tellers opruimen: niets ouder dan een dag is nog nodig.
    env.DB.prepare('DELETE FROM rate_events WHERE at < ?').bind(seconds - 86400),
  ]);
}
