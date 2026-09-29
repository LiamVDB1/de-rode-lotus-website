import type { APIRoute } from 'astro';
import { json, problem } from '../../../../../lib/http';
import { addToTeam } from '../../../../../lib/inbox';

const messages = {
  missing: ['Aanmelding niet gevonden.', 404],
  exists: ['Er staat al een vrijwilliger met deze naam op de pagina.', 409],
  full: ['De vrijwilligerslijst is vol (max. 80).', 409],
} as const;

export const POST: APIRoute = async ({ params }) => {
  const result = await addToTeam(params.id ?? '');
  if (result !== 'ok') {
    const [message, status] = messages[result];
    return problem(message, status);
  }
  return json({ ok: true });
};
