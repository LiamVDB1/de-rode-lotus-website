import type { APIRoute } from 'astro';
import { publishAll } from '../../../lib/content';
import { json } from '../../../lib/http';

export const POST: APIRoute = async () => json({ ok: true, published: await publishAll() });
