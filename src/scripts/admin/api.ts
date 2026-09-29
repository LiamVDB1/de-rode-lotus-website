export interface Issue {
  path: string;
  message: string;
}

export type ApiResult<T> =
  | ({ ok: true; status: number } & T)
  | { ok: false; status: number; message: string; issues?: Issue[] };

type Tone = 'info' | 'success' | 'error';

export function toast(message: string, tone: Tone = 'info'): void {
  const region = document.querySelector('.toasts');
  if (!region) return;
  const item = document.createElement('div');
  item.className = `toast toast-${tone}`;
  item.textContent = message;
  region.append(item);
  window.setTimeout(() => {
    item.classList.add('leaving');
    window.setTimeout(() => item.remove(), 300);
  }, tone === 'error' ? 7000 : 4000);
}

/** Roept de beheer-API aan. Fouten verschijnen als melding tenzij `quiet`. */
export async function api<T = object>(method: string, url: string, body?: unknown, options: { quiet?: boolean } = {}): Promise<ApiResult<T>> {
  const init: RequestInit = { method, headers: { Accept: 'application/json' }, credentials: 'same-origin' };
  if (body instanceof FormData) init.body = body;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    const message = 'Geen verbinding met de server. Controleer je internet en probeer opnieuw.';
    if (!options.quiet) toast(message, 'error');
    return { ok: false, status: 0, message };
  }

  if (response.status === 401) {
    location.href = `/beheer/login?terug=${encodeURIComponent(location.href)}`;
    return { ok: false, status: 401, message: 'Log opnieuw in.' };
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (response.ok) return { ...(data as T), ok: true, status: response.status };

  const message = typeof data.message === 'string' ? data.message : 'Er liep iets mis. Probeer opnieuw.';
  if (!options.quiet) toast(message, 'error');
  return { ok: false, status: response.status, message, issues: Array.isArray(data.issues) ? (data.issues as Issue[]) : undefined };
}
