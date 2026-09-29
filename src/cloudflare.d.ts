/**
 * Minimale types voor de Cloudflare-bindings die deze site gebruikt.
 *
 * De volledige runtime-types van `wrangler types` overschrijven DOM-types (Element, Response…) en
 * breken zo de browserscripts van /beheer, die in hetzelfde TypeScript-project zitten. Daarom
 * beschrijven we hier enkel wat we echt aanroepen.
 */

interface D1Meta {
  changes?: number;
}
interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: D1Meta;
}
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface R2HttpMetadata {
  contentType?: string;
  cacheControl?: string;
}
interface R2Object {
  key: string;
  size: number;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}
interface R2ObjectBody extends R2Object {
  body: ReadableStream;
}
interface R2Bucket {
  get(key: string, options?: { onlyIf?: Headers }): Promise<R2Object | R2ObjectBody | null>;
  put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream | string, options?: { httpMetadata?: R2HttpMetadata }): Promise<R2Object | null>;
  delete(key: string | string[]): Promise<void>;
}

interface Fetcher {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

declare module 'cloudflare:workers' {
  export const env: Cloudflare.Env;
}
