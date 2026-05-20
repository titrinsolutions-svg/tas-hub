import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import { checkApiKey, unauthorized, ok, methodNotAllowed, serverError } from './_shared.js';

const STORE_NAME = 'hub';
const KEY = 'notes.json';

type NotesPayload = { notes: string };

export default async function handler(req: Request, _ctx: Context): Promise<Response> {
  if (!checkApiKey(req)) return unauthorized();

  try {
    const store = getStore(STORE_NAME);

    if (req.method === 'GET') {
      const data = (await store.get(KEY, { type: 'json' })) as NotesPayload | null;
      return ok({ notes: data?.notes ?? '' });
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as Partial<NotesPayload>;
      await store.setJSON(KEY, { notes: body.notes ?? '' });
      return ok({ saved: true });
    }

    return methodNotAllowed();
  } catch (err) {
    return serverError(err);
  }
}
