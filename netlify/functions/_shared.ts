import type { Context } from '@netlify/functions';

const API_KEY = process.env.TAS_HUB_API_KEY || 'tas-hub-local-key-2026';

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}

export function ok(body: unknown): Response {
  return Response.json(body);
}

export function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'content-type': 'application/json' },
  });
}

export function badRequest(msg: string): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
}

export function serverError(err: unknown): Response {
  const msg = err instanceof Error ? err.message : String(err);
  return new Response(JSON.stringify({ error: msg }), {
    status: 500,
    headers: { 'content-type': 'application/json' },
  });
}

export function checkApiKey(req: Request): boolean {
  const key = req.headers.get('x-api-key');
  return key === API_KEY;
}

export type Handler = (req: Request, ctx: Context) => Promise<Response> | Response;
