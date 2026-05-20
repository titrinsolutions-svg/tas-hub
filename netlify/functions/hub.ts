import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import { checkApiKey, unauthorized, ok, methodNotAllowed, serverError } from './_shared.js';

const STORE_NAME = 'hub';
const KEY = 'state.json';

type HubState = {
  userEdits?: Record<string, unknown>;
  lastUpdated?: string;
};

async function readState(): Promise<HubState> {
  const store = getStore(STORE_NAME);
  const data = await store.get(KEY, { type: 'json' });
  return (data as HubState | null) ?? {};
}

async function writeState(state: HubState): Promise<void> {
  const store = getStore(STORE_NAME);
  await store.setJSON(KEY, {
    ...state,
    lastUpdated: new Date().toISOString(),
  });
}

export default async function handler(req: Request, _ctx: Context): Promise<Response> {
  if (!checkApiKey(req)) return unauthorized();

  try {
    if (req.method === 'GET') {
      const state = await readState();
      return ok({ hub: state });
    }

    if (req.method === 'POST') {
      const body = (await req.json()) as Partial<HubState>;
      await writeState(body);
      return ok({ saved: true });
    }

    if (req.method === 'PATCH') {
      const current = await readState();
      const partial = (await req.json()) as Partial<HubState>;
      await writeState({ ...current, ...partial });
      return ok({ saved: true });
    }

    return methodNotAllowed();
  } catch (err) {
    return serverError(err);
  }
}
