import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import { checkApiKey, unauthorized, ok, methodNotAllowed, badRequest, serverError } from './_shared.js';

const STORE_NAME = 'field-submissions';
const INDEX_KEY = '_index.json';

export type FieldSubmissionStatus = 'pending' | 'attached' | 'discarded';

export interface FieldSubmission {
  id: string;
  submittedAt: string;
  submittedBy: string;
  status: FieldSubmissionStatus;
  projectName?: string;
  siteAddress: string;
  gps?: { lat: number; lng: number };

  // Structured P-10 raw evidence (new schema)
  pits?: unknown[];                 // PitObservation[] — kept as unknown here to avoid coupling
  site?: unknown;                   // SiteObservations

  // Legacy
  testPits?: unknown[];
  observations?: string;
  aiSummary?: string;
  photoCount?: number;
  rawData?: Record<string, unknown>;
}

interface IndexEntry {
  id: string;
  status: FieldSubmissionStatus;
  submittedAt: string;
}

function newId(): string {
  return `fs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function keyFor(id: string): string {
  return `${id}.json`;
}

// Index pattern: a single _index.json holds {entries: IndexEntry[]} so we get
// strongly-consistent listing without relying on store.list() (which is eventually
// consistent in Netlify Blobs).
async function readIndex(store: ReturnType<typeof getStore>): Promise<IndexEntry[]> {
  const data = (await store.get(INDEX_KEY, { type: 'json' })) as { entries: IndexEntry[] } | null;
  return data?.entries ?? [];
}

async function writeIndex(store: ReturnType<typeof getStore>, entries: IndexEntry[]): Promise<void> {
  await store.setJSON(INDEX_KEY, { entries });
}

async function upsertIndex(
  store: ReturnType<typeof getStore>,
  entry: IndexEntry
): Promise<void> {
  const entries = await readIndex(store);
  const i = entries.findIndex(e => e.id === entry.id);
  if (i >= 0) entries[i] = entry;
  else entries.push(entry);
  await writeIndex(store, entries);
}

async function removeFromIndex(store: ReturnType<typeof getStore>, id: string): Promise<void> {
  const entries = await readIndex(store);
  await writeIndex(store, entries.filter(e => e.id !== id));
}

export default async function handler(req: Request, _ctx: Context): Promise<Response> {
  if (!checkApiKey(req)) return unauthorized();

  try {
    const store = getStore({ name: STORE_NAME, consistency: 'strong' });
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
        projectName: body.projectName,
        gps: body.gps,
        // Structured P-10 fields
        pits: body.pits,
        site: body.site,
        // Legacy passthrough
        testPits: body.testPits,
        observations: body.observations,
        aiSummary: body.aiSummary,
        photoCount: body.photoCount,
        rawData: body.rawData,
      };

      await store.setJSON(keyFor(submission.id), submission);
      await upsertIndex(store, {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
      });
      return ok({ submission });
    }

    if (req.method === 'GET' && id) {
      const sub = (await store.get(keyFor(id), { type: 'json' })) as FieldSubmission | null;
      if (!sub) return badRequest('not found');
      return ok({ submission: sub });
    }

    if (req.method === 'GET' && !id) {
      const statusFilter = url.searchParams.get('status') as FieldSubmissionStatus | null;
      const entries = await readIndex(store);
      const filtered = statusFilter
        ? entries.filter(e => e.status === statusFilter)
        : entries;

      // Sort newest first using the index timestamps (avoids fetching everyone)
      filtered.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

      const items: FieldSubmission[] = [];
      for (const e of filtered) {
        const sub = (await store.get(keyFor(e.id), { type: 'json' })) as FieldSubmission | null;
        if (sub) items.push(sub);
      }
      return ok({ submissions: items });
    }

    if (req.method === 'PATCH' && id) {
      const existing = (await store.get(keyFor(id), { type: 'json' })) as FieldSubmission | null;
      if (!existing) return badRequest('not found');
      const patch = (await req.json()) as Partial<FieldSubmission>;
      const updated: FieldSubmission = { ...existing, ...patch, id: existing.id };
      await store.setJSON(keyFor(id), updated);
      await upsertIndex(store, {
        id: updated.id,
        status: updated.status,
        submittedAt: updated.submittedAt,
      });
      return ok({ submission: updated });
    }

    if (req.method === 'DELETE' && id) {
      await store.delete(keyFor(id));
      await removeFromIndex(store, id);
      return ok({ deleted: true });
    }

    return methodNotAllowed();
  } catch (err) {
    return serverError(err);
  }
}
