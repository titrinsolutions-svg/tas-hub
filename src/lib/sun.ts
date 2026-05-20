/**
 * Solar position math — pure functions, no API needed.
 * Useful for soil photo Munsell color analysis because shadow direction +
 * elevation angle materially affect perceived color.
 *
 * Algorithm: NOAA Solar Calculator approximations.
 * Reference: https://gml.noaa.gov/grad/solcalc/calcdetails.html
 * Accurate to ±0.5° for elevation/azimuth at any latitude.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export interface SunPosition {
  /** Degrees above horizon. Negative = below horizon (sun is down). */
  elevation: number;
  /** Compass bearing 0-360, measured clockwise from true north. */
  azimuth: number;
  /** Whether sun is above horizon at this instant. */
  isDaylight: boolean;
  /** Hours since solar noon (negative = morning). */
  hourAngle: number;
  /** Solar noon at this location (local-ish ISO). */
  solarNoonIso?: string;
}

function julianDate(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

export function sunPosition(lat: number, lng: number, when: Date): SunPosition {
  const jd = julianDate(when);
  const n = jd - 2451545.0;             // days since J2000.0
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;
  const epsilon = (23.439 - 0.0000004 * n) * DEG;
  const alpha = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const delta = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

  // Mean sidereal time at Greenwich, hours
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = (gmst + lng / 15) % 24;          // local sidereal time
  const hourAngle = (lst * 15 * DEG) - alpha;

  const latRad = lat * DEG;
  const sinAlt = Math.sin(latRad) * Math.sin(delta) + Math.cos(latRad) * Math.cos(delta) * Math.cos(hourAngle);
  const altitude = Math.asin(sinAlt);
  const cosAz = (Math.sin(delta) - Math.sin(altitude) * Math.sin(latRad)) / (Math.cos(altitude) * Math.cos(latRad));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(hourAngle) > 0) azimuth = 2 * Math.PI - azimuth;

  const elevationDeg = altitude * RAD;
  const azimuthDeg = (azimuth * RAD + 360) % 360;
  const hoursFromNoon = ((hourAngle * RAD) / 15);

  return {
    elevation: Math.round(elevationDeg * 10) / 10,
    azimuth: Math.round(azimuthDeg * 10) / 10,
    isDaylight: elevationDeg > 0,
    hourAngle: Math.round(hoursFromNoon * 100) / 100,
  };
}

/** Human-friendly description of sun position. */
export function describeSun(s: SunPosition): string {
  if (!s.isDaylight) return `sun below horizon (${s.elevation}°)`;
  const dir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(s.azimuth / 45) % 8];
  const height =
    s.elevation < 10 ? 'very low'
    : s.elevation < 25 ? 'low'
    : s.elevation < 50 ? 'mid'
    : s.elevation < 70 ? 'high'
    : 'very high';
  return `${height} sun ${s.elevation}° elevation, ${dir} azimuth (${s.azimuth}°)`;
}
