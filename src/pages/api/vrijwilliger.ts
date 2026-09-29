import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { fingerprint } from '../../lib/auth';
import { clientIp, json, problem, sameOrigin } from '../../lib/http';
import { notifyNewVolunteer } from '../../lib/notify';
import { recordEvent, underLimit } from '../../lib/ratelimit';
import { formatIssues, volunteerSchema } from '../../lib/schema';
import { verifyTurnstile } from '../../lib/turnstile';

const MAX_BYTES = 16_000;

export const POST: APIRoute = async ({ request, url }) => {
  if (!sameOrigin(request)) return problem('Ongeldig verzoek.', 403);
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BYTES) return problem('Je bericht is te lang.', 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return problem('Ongeldig formulier.');
  }

  // Honeypot: echte bezoekers zien dit veld niet.
  if (String(form.get('website') ?? '') !== '') return json({ ok: true });

  const ip = clientIp(request);
  const ipKey = `vrijwilliger:${await fingerprint(ip)}`;
  const allowed = await underLimit([
    { bucket: ipKey, max: 5, windowSeconds: 3600 },
    { bucket: 'vrijwilliger:alle', max: 60, windowSeconds: 3600 },
  ]);
  if (!allowed) return problem('Er kwamen te veel aanmeldingen binnen. Probeer het later opnieuw of bel ons.', 429);

  const parsed = volunteerSchema.safeParse({
    name: form.get('name') ?? '',
    email: form.get('email') ?? '',
    phone: form.get('phone') ?? '',
    availability: form.get('availability') ?? '',
    message: form.get('message') ?? '',
    consent: form.get('consent') ?? '',
  });
  if (!parsed.success) return problem('Kijk de gemarkeerde velden na.', 422, { issues: formatIssues(parsed.error) });

  const human = await verifyTurnstile(String(form.get('cf-turnstile-response') ?? ''), ip, url);
  if (!human) return problem('De controle tegen spam lukte niet. Probeer opnieuw.', 400);

  const { consent: _consent, ...submission } = parsed.data;
  await env.DB.prepare(
    'INSERT INTO submissions (id, created_at, name, email, phone, availability, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(crypto.randomUUID(), new Date().toISOString(), submission.name, submission.email, submission.phone, submission.availability, submission.message)
    .run();
  await recordEvent([ipKey, 'vrijwilliger:alle']);
  await notifyNewVolunteer(submission, new URL('/beheer/inbox', url.origin).toString());

  return json({ ok: true });
};
