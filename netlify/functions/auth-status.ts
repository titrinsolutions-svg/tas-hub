import type { Context } from '@netlify/functions';

export default async function handler(_req: Request, _ctx: Context): Promise<Response> {
  return Response.json({
    authenticated: false,
    email: undefined,
  });
}
