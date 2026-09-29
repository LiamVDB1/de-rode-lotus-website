import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { loadDraft, saveDraft } from './content';
import { teamSchema } from './schema';

export const STATUSES = ['nieuw', 'gelezen', 'afgehandeld'] as const;
export type Status = (typeof STATUSES)[number];
export const statusSchema = z.object({ status: z.enum(STATUSES) });

export interface Submission {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  availability: string;
  message: string;
  status: Status;
}

export async function listSubmissions(): Promise<Submission[]> {
  const { results } = await env.DB.prepare(
    'SELECT id, created_at, name, email, phone, availability, message, status FROM submissions ORDER BY created_at DESC LIMIT 500',
  ).all<Submission>();
  return results;
}

export async function countNew(): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM submissions WHERE status = 'nieuw'").first<{ n: number }>();
  return row?.n ?? 0;
}

export async function setStatus(id: string, status: Status): Promise<boolean> {
  const result = await env.DB.prepare('UPDATE submissions SET status = ? WHERE id = ?').bind(status, id).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM submissions WHERE id = ?').bind(id).run();
  return (result.meta.changes ?? 0) > 0;
}

/** Zet de kandidaat als vrijwilliger in de werkversie van de vrijwilligerspagina (nog niet gepubliceerd). */
export async function addToTeam(id: string): Promise<'ok' | 'missing' | 'exists' | 'full'> {
  const submission = await env.DB.prepare('SELECT name FROM submissions WHERE id = ?').bind(id).first<{ name: string }>();
  if (!submission) return 'missing';

  const team = await loadDraft('team');
  const name = submission.name.trim().slice(0, 80);
  if (team.members.some((member) => member.name.toLowerCase() === name.toLowerCase())) return 'exists';

  const next = teamSchema.safeParse({ ...team, members: [...team.members, { name, role: 'Vrijwilliger', photo: '', photoAlt: '', text: '' }] });
  if (!next.success) return 'full';
  await saveDraft('team', next.data);
  return 'ok';
}
