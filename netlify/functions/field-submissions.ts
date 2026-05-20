import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import { checkApiKey, unauthorized, ok, methodNotAllowed, badRequest, serverError } from './_shared.js';

const STORE_NAME = 'field-submissions';

export type FieldSubmissionStatus = 'pending' | 'attached' | 'discarded';

export interface FieldSubmission {
  id: string;
  submittedAt: string;
  submittedBy: string;
  status: FieldSubmissionStatus;
  projectName?: string;
  siteAddress: string;
  gps?: { lat: number; lng: number };
  testPits?: unknown[];
  observations?: string;
  aiSummary?: string;
  photoCount?: number;
  rawData?: Record<string, unknown>;
}

function newId(): string {
  return `fs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function keyFor(id: string): string {
  return `${id}.json`;
}

export default async function handler(req: Request, _ctx: Context): Promise<Response> {
  if (!checkApiKey(req)) return unauthorized();

  try {
    const store = getStore(STORE_NAME);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (req.method === 'POST' && !id) {
      const body = (await req.json()) as Partial<FieldSubmission>;
      if (!body.siteAddress) return badRequest('siteAddress is required');

      const submission: FieldSubmission = {
        id: newId(),
        submittedAt: new Date().toISOString(),
        submittedBy: body.submittedBy ?? 'field',
        status: 'pending',
        siteAddress: body.siteAddress,
        gps: body.gps,
        testPits: body.testPits,
        observations: body.observations,
        aiSummary: body.aiSummary,
        photoCount: body.photoCount,
        rawData: body.rawData,
      };

      await store.setJSON(keyFor(submission.id), submission);
      return ok({ submission });
    }

    if (req.method === 'GET' && id) {
      const sub = (await store.get(keyFor(id), { type: 'json' })) as FieldSubmission | null;
      if (!sub) return badRequest('not found');
      return ok({ submission: sub });
    }

    if (req.method === 'GET' && !id) {
      const statusFilter = url.searchParams.get('status') as FieldSubmissionStatus | null;
      const { blobs } = await store.list();
      const items: FieldSubmission[] = [];
      for (const b of blobs) {
        const sub = (await store.get(b.key, { type: 'json' })) as FieldSubmission | null;
        if (sub && (!statusFilter || sub.status === statusFilter)) {
          items.push(sub);
        }
      }
      items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
      return ok({ submissions: items });
    }

    if (req.method === 'PATCH' && id) {
      const existing = (await store.get(keyFor(id), { type: 'json' })) as FieldSubmission | null;
      if (!existing) return badRequest('not found');
      const patch = (await req.json()) as Partial<FieldSubmission>;
      const updated: FieldSubmission = { ...existing, ...patch, id: existing.id };
      await store.setJSON(keyFor(id), updated);
      return ok({ submission: updated });
    }

    if (req.method === 'DELETE' && id) {
      await store.delete(keyFor(id));
      return ok({ deleted: true });
    }

    return methodNotAllowed();
  } catch (err) {
    return serverError(err);
  }
}
