import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { fingerprint } from '../../lib/auth';
import { clientIp, json, problem, sameOrigin } from '../../lib/http';
import { fieldMessage, formMessage, LANGS, type Lang } from '../../lib/i18n';
import { notifyNewVolunteer } from '../../lib/notify';
import { ipScope, recordEvent, underLimit } from '../../lib/ratelimit';
import { formatIssues, volunteerSchema } from '../../lib/schema';
import { verifyTurnstile } from '../../lib/turnstile';

const MAX_BYTES = 16_000;

export const POST: APIRoute = async ({ request, url }) => {
  if (!sameOrigin(request)) return problem(formMessage('nl', 'invalid'), 403);
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BYTES) return problem(formMessage('nl', 'tooLong'), 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return problem(formMessage('nl', 'badForm'));
  }
  const requested = String(form.get('lang') ?? 'nl');
  const lang: Lang = (LANGS as readonly string[]).includes(requested) ? (requested as Lang) : 'nl';
  const say = (key: string) => formMessage(lang, key);

  // Honeypot: echte bezoekers zien dit veld niet.
  if (String(form.get('website') ?? '') !== '') return json({ ok: true });

  const ip = clientIp(request);
  const ipKey = `vrijwilliger:${await fingerprint(ipScope(ip))}`;
  const allowed = await underLimit([
    { bucket: ipKey, max: 5, windowSeconds: 3600 },
    { bucket: 'vrijwilliger:alle', max: 60, windowSeconds: 3600 },
  ]);
  if (!allowed) return problem(say('rateLimited'), 429);

  const parsed = volunteerSchema.safeParse({
    name: form.get('name') ?? '',
    email: form.get('email') ?? '',
    phone: form.get('phone') ?? '',
    availability: form.get('availability') ?? '',
    message: form.get('message') ?? '',
    consent: form.get('consent') ?? '',
  });
  if (!parsed.success) {
    const issues = formatIssues(parsed.error).map((issue) => ({ path: issue.path, message: fieldMessage(lang, issue.path, issue.message) }));
    return problem(say('checkFields'), 422, { issues });
  }

  const human = await verifyTurnstile(String(form.get('cf-turnstile-response') ?? ''), ip, url);
  if (!human) return problem(say('spam'), 400);

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
