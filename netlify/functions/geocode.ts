import type { Context } from '@netlify/functions';
import { checkApiKey, unauthorized, ok, methodNotAllowed, badRequest, serverError } from './_shared.js';

interface GeocodeResponse {
  source: 'nominatim';
  lat: number;
  lng: number;
  displayName?: string;
  road?: string;
  house?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  raw?: Record<string, unknown>;
}

export default async function handler(req: Request, _ctx: Context): Promise<Response> {
  if (!checkApiKey(req)) return unauthorized();
  if (req.method !== 'GET') return methodNotAllowed();

  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '');
    const lng = parseFloat(url.searchParams.get('lng') || '');
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return badRequest('lat and lng query params are required');
    }

    // Nominatim TOS: identify yourself, max 1 req/sec, no heavy use.
    // For our scale (few requests per submission) this is well within bounds.
    const nUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`;
    const res = await fetch(nUrl, {
      headers: {
        'User-Agent': 'TAS-Hub (Titrin AgriSoil Solutions) titrinsolutions@gmail.com',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return serverError(new Error(`Nominatim returned ${res.status}`));
    }
    const j: any = await res.json();
    const a = j.address || {};
    const resp: GeocodeResponse = {
      source: 'nominatim',
      lat,
      lng,
      displayName: j.display_name,
      road: a.road || a.pedestrian || a.path,
      house: a.house_number,
      city: a.city || a.town || a.village || a.hamlet,
      state: a.state,
      postalCode: a.postcode,
      country: a.country,
      raw: j,
    };
    return ok(resp);
  } catch (err) {
    return serverError(err);
  }
}
