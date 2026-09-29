import { env } from 'cloudflare:workers';
import type { AstroCookies } from 'astro';

/**
 * Eén beheerdersaccount. Het wachtwoord staat enkel als PBKDF2-hash in de secret ADMIN_PASSWORD_HASH
 * (formaat `pbkdf2-sha256$<iteraties>$<salt b64>$<hash b64>`, zie scripts/set-admin-password.mjs).
 * De sessie is een HMAC-ondertekend cookie; een nieuw wachtwoord of SESSION_SECRET maakt alle sessies ongeldig.
 */
export const SESSION_COOKIE = 'lotus_beheer';
export const PREVIEW_COOKIE = 'lotus_voorbeeld';
const SESSION_DAYS = 14;
const encoder = new TextEncoder();

const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const b64url = (bytes: ArrayBuffer | Uint8Array) => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function secret(name: 'ADMIN_PASSWORD_HASH' | 'SESSION_SECRET'): string {
  const value = env[name];
  if (typeof value !== 'string' || value.length < 16) throw new Error(`Secret ${name} ontbreekt of is te kort.`);
  return value;
}

export function authConfigured(): boolean {
  return typeof env.ADMIN_PASSWORD_HASH === 'string' && typeof env.SESSION_SECRET === 'string' && env.SESSION_SECRET.length >= 32;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const [scheme, iterations, salt, hash] = secret('ADMIN_PASSWORD_HASH').split('$');
  if (scheme !== 'pbkdf2-sha256' || !iterations || !salt || !hash) throw new Error('ADMIN_PASSWORD_HASH heeft een onbekend formaat.');
  const key = await crypto.subtle.importKey('raw', encoder.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(salt), iterations: Number(iterations) },
    key,
    256,
  );
  return timingSafeEqual(new Uint8Array(derived), fromB64(hash));
}

async function sign(payload: string): Promise<string> {
  // De wachtwoordhash zit mee in de sleutel: wie het wachtwoord wijzigt, logt iedereen uit.
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`${secret('SESSION_SECRET')}|${secret('ADMIN_PASSWORD_HASH')}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return b64url(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_DAYS * 86400;
  const payload = `v1.${expires}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  if (!token || !authConfigured()) return false;
  const match = /^(v1\.(\d{10}))\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  if (Number(match[2]) * 1000 < now) return false;
  const expected = await sign(match[1]);
  return timingSafeEqual(encoder.encode(expected), encoder.encode(match[3]));
}

/** Cookie-opties: gedeeld over derodelotus.com, www en preview; elders enkel voor die host. */
export function cookieOptions(url: URL, maxAge: number) {
  const domain = typeof env.COOKIE_DOMAIN === 'string' && env.COOKIE_DOMAIN && url.hostname.endsWith(env.COOKIE_DOMAIN) ? env.COOKIE_DOMAIN : undefined;
  return {
    path: '/',
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax' as const,
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

export async function startSession(cookies: AstroCookies, url: URL): Promise<void> {
  cookies.set(SESSION_COOKIE, await createSessionToken(), cookieOptions(url, SESSION_DAYS * 86400));
}

export function endSession(cookies: AstroCookies, url: URL): void {
  cookies.delete(SESSION_COOKIE, cookieOptions(url, 0));
  cookies.delete(PREVIEW_COOKIE, cookieOptions(url, 0));
}

/** Korte, niet-omkeerbare vingerafdruk van een IP-adres voor rate limiting. */
export async function fingerprint(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${env.SESSION_SECRET ?? ''}|${value}`));
  return b64url(digest).slice(0, 22);
}
