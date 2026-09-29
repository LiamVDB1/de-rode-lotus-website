import { env } from 'cloudflare:workers';

export interface Submission {
  name: string;
  email: string;
  phone: string;
  availability: string;
  message: string;
}

/**
 * Stuurt een melding naar het vaste adres (NOTIFY_TO). Werkt enkel als de binding NOTIFY bestaat
 * (Cloudflare Email Routing met een geverifieerd bestemmingsadres). Zonder binding staat de aanmelding
 * gewoon in de inbox van /beheer.
 */
export async function notifyNewVolunteer(submission: Submission, adminUrl: string): Promise<void> {
  const binding = (env as unknown as { NOTIFY?: { send: (message: Record<string, unknown>) => Promise<unknown> } }).NOTIFY;
  if (!binding || typeof env.NOTIFY_TO !== 'string' || typeof env.NOTIFY_FROM !== 'string') return;
  const lines = [
    `Nieuwe aanmelding als vrijwilliger via de website.`,
    '',
    `Naam: ${submission.name}`,
    `E-mail: ${submission.email}`,
    `Telefoon: ${submission.phone || '—'}`,
    `Beschikbaarheid: ${submission.availability || '—'}`,
    '',
    submission.message || '(geen bericht)',
    '',
    `Bekijk alle aanmeldingen: ${adminUrl}`,
  ];
  try {
    await binding.send({
      to: env.NOTIFY_TO,
      from: { email: env.NOTIFY_FROM, name: 'Website De Rode Lotus' },
      replyTo: submission.email,
      subject: `Nieuwe vrijwilliger: ${submission.name.replace(/\p{Cc}/gu, ' ').slice(0, 60)}`,
      text: lines.join('\n'),
    });
  } catch (error) {
    console.error('E-mailmelding versturen mislukt', error);
  }
}
