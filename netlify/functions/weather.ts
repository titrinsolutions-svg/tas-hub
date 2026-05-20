import type { Context } from '@netlify/functions';
import { checkApiKey, unauthorized, ok, methodNotAllowed, badRequest, serverError } from './_shared.js';

const OWM_KEY = process.env.OPENWEATHER_API_KEY;

interface CurrentWeather {
  tempC?: number;
  humidity?: number;
  windKph?: number;
  windDir?: number;
  conditions?: string;
  cloudPct?: number;
  pressureHpa?: number;
  fetchedAt: string;
}

interface PrecipSummary {
  last24hMm?: number;
  last48hMm?: number;
  last72hMm?: number;
  hourlyMm: { time: string; mm: number }[];
}

interface WeatherResponse {
  source: 'openweathermap';
  configured: boolean;
  lat: number;
  lng: number;
  current?: CurrentWeather;
  precip?: PrecipSummary;
  note?: string;
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

    if (!OWM_KEY) {
      const resp: WeatherResponse = {
        source: 'openweathermap',
        configured: false,
        lat,
        lng,
        note: 'OPENWEATHER_API_KEY not set in Netlify env. Field-time weather unavailable; Cowork should pull ECCC for the report citation.',
      };
      return ok(resp);
    }

    // ── Current conditions ────────────────────────────────────────────────
    const curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${OWM_KEY}`;
    const curRes = await fetch(curUrl, { signal: AbortSignal.timeout(8000) });
    let current: CurrentWeather | undefined;
    if (curRes.ok) {
      const j: any = await curRes.json();
      current = {
        tempC: j.main?.temp,
        humidity: j.main?.humidity,
        windKph: j.wind?.speed != null ? Math.round(j.wind.speed * 3.6 * 10) / 10 : undefined,
        windDir: j.wind?.deg,
        conditions: j.weather?.[0]?.description,
        cloudPct: j.clouds?.all,
        pressureHpa: j.main?.pressure,
        fetchedAt: new Date().toISOString(),
      };
    }

    // ── Recent precip: free tier has /3.0/onecall (1000 calls/day) ────────
    // Falls back gracefully if account doesn't have onecall access.
    let precip: PrecipSummary | undefined;
    try {
      const ocUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=current,minutely,daily,alerts&units=metric&appid=${OWM_KEY}`;
      const ocRes = await fetch(ocUrl, { signal: AbortSignal.timeout(10000) });
      if (ocRes.ok) {
        const j: any = await ocRes.json();
        const hours: { dt: number; rain?: { '1h'?: number }; snow?: { '1h'?: number } }[] = j.hourly || [];
        const nowSec = Date.now() / 1000;
        const hourly = hours.slice(0, 72).map(h => ({
          time: new Date(h.dt * 1000).toISOString(),
          mm: (h.rain?.['1h'] || 0) + (h.snow?.['1h'] || 0),
        }));
        const sumWithin = (hoursBack: number) =>
          hours
            .filter(h => nowSec - h.dt <= hoursBack * 3600)
            .reduce((a, h) => a + (h.rain?.['1h'] || 0) + (h.snow?.['1h'] || 0), 0);
        precip = {
          last24hMm: Math.round(sumWithin(24) * 10) / 10,
          last48hMm: Math.round(sumWithin(48) * 10) / 10,
          last72hMm: Math.round(sumWithin(72) * 10) / 10,
          hourlyMm: hourly,
        };
      }
    } catch {
      // onecall is paywalled in newer OWM tiers — degrade gracefully
    }

    const resp: WeatherResponse = {
      source: 'openweathermap',
      configured: true,
      lat,
      lng,
      current,
      precip,
      note: precip ? undefined : 'Current conditions captured. Precip history requires OneCall API tier (1000 free calls/day at openweathermap.org).',
    };
    return ok(resp);
  } catch (err) {
    return serverError(err);
  }
}
