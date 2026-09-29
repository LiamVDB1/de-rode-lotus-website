/// <reference types="astro/client" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    MEDIA: R2Bucket;
    ASSETS: Fetcher;
    SITE_ORIGIN: string;
    COOKIE_DOMAIN: string;
    TURNSTILE_SITE_KEY: string;
    NOTIFY_TO: string;
    NOTIFY_FROM: string;
    ADMIN_PASSWORD_HASH?: string;
    SESSION_SECRET?: string;
    TURNSTILE_SECRET?: string;
  }
}

declare namespace App {
  interface Locals {
    /** Ingelogd als beheerder. */
    admin: boolean;
    /** Toon werkversies (preview.derodelotus.com of voorbeeldmodus). */
    draft: boolean;
  }
}
