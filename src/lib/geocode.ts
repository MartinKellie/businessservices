import { env } from '@/env';
import { HttpError } from '@/lib/http';

export type GeocodeResult = { label: string; lat: number; lng: number };

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// Loose viewbox around greater Cúcuta (incl. Los Patios, Villa del Rosario) — biases
// results toward the launch area without excluding matches outside it (`bounded` unset).
const CUCUTA_VIEWBOX = '-72.62,7.98,-72.42,7.76'; // left,top,right,bottom
const USER_AGENT = `DirectorioCucuta/1.0 (${env.GEOCODE_CONTACT_EMAIL ?? 'contact via MK1GROUP'})`;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map<string, { expiresAt: number; results: GeocodeResult[] }>();

// ponytail: process-local throttle/cache only — fine for MVP traffic on a single
// instance. If this runs hot across multiple serverless instances, Nominatim's "max 1
// req/sec" usage policy needs a shared store (e.g. Upstash Redis) instead.
let nextAllowedAt = 0;
async function throttle(): Promise<void> {
  const wait = nextAllowedAt - Date.now();
  nextAllowedAt = Math.max(Date.now(), nextAllowedAt) + 1100;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

/**
 * Resolves a typed address/area to coordinates for "Near me" (scope §10), via the free
 * Nominatim (OpenStreetMap) geocoder. Results are cached and calls are throttled to
 * respect Nominatim's usage policy.
 */
export async function searchAddress(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeocodeResult[]> {
  const key = query.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  await throttle();

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', query);
  url.searchParams.set('countrycodes', 'co');
  url.searchParams.set('viewbox', CUCUTA_VIEWBOX);
  url.searchParams.set('limit', '5');

  const response = await fetchImpl(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es' },
  });
  if (!response.ok) {
    throw new HttpError(502, 'geocode_unavailable', 'No se pudo buscar la dirección.');
  }

  const rows = (await response.json()) as { display_name: string; lat: string; lon: string }[];
  const results = rows.map((row) => ({
    label: row.display_name,
    lat: Number(row.lat),
    lng: Number(row.lon),
  }));

  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });

  return results;
}
