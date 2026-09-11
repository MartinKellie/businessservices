import type { ApiError } from '@/lib/http';

/** Public area row from GET /api/areas. */
export interface PublicArea {
  id: string;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
}

/** Public category row from GET /api/categories. */
export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  isPopular: boolean;
  businessCount: number;
}

export interface PublicSettings {
  maintenanceMode: boolean;
  announcement: { enabled: boolean; text: string };
  nearMeRadiusMeters: number;
  showLastUpdated: boolean;
}

export interface SearchContact {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
}

export interface SearchCard {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryCategory: { name: string; slug: string; icon: string | null } | null;
  otherCategories: { name: string; slug: string }[];
  areaName: string | null;
  serviceAreaNote: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  openStatus: 'open' | 'closed' | null;
  distanceMeters: number | null;
  contact: SearchContact;
}

export interface SearchPin {
  businessId: string;
  name: string;
  status: string;
  lat: number;
  lng: number;
}

export interface SearchResult {
  results: SearchCard[];
  pins: SearchPin[];
  total: number;
  page: number;
  pageSize: number;
  appliedAreaId: string | null;
  appliedRadiusMeters: number | null;
  resolved: { conceptIds: string[]; categoryIds: string[]; globalTerms: string[] };
}

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  status: string;
  primaryCategory: { name: string; slug: string; icon: string | null } | null;
  otherCategories: { name: string; slug: string }[];
  area: { name: string; slug: string } | null;
  address: string | null;
  location: { lat: number; lng: number } | null;
  serviceAreaNote: string | null;
  logoUrl: string | null;
  photoUrls: string[];
  contact: SearchContact;
  openingHours: { dayOfWeek: number; opensAt: string; closesAt: string }[];
  relocatedTo: { id: string; slug: string; name: string } | null;
  lastUpdatedAt: string | Date | null;
}

export interface SearchQuery {
  q?: string;
  areaId?: string;
  lat?: number;
  lng?: number;
  categoryId?: string;
  openNow?: boolean;
  whatsapp?: boolean;
  page?: number;
}

export class PublicApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'PublicApiError';
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as (T & ApiError) | null;
  if (!response.ok) {
    throw new PublicApiError(
      response.status,
      body && 'error' in body ? body.error.code : 'request_failed',
      body && 'error' in body ? body.error.message : 'No se pudo completar la solicitud.',
      body && 'error' in body ? body.error.fields : undefined,
    );
  }
  return body as T;
}

export async function fetchPublicSettings(): Promise<PublicSettings> {
  return readJson<PublicSettings>(await fetch('/api/settings/public', { cache: 'no-store' }));
}

export async function fetchAreas(): Promise<PublicArea[]> {
  const data = await readJson<{ areas: PublicArea[] }>(await fetch('/api/areas', { cache: 'no-store' }));
  return data.areas;
}

export async function fetchCategories(popular = false): Promise<PublicCategory[]> {
  const path = popular ? '/api/categories?popular=1' : '/api/categories';
  const data = await readJson<{ categories: PublicCategory[] }>(
    await fetch(path, { cache: 'no-store' }),
  );
  return data.categories;
}

export function searchQueryToParams(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.lat != null && query.lng != null) {
    params.set('lat', String(query.lat));
    params.set('lng', String(query.lng));
  } else if (query.areaId) {
    params.set('areaId', query.areaId);
  }
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.openNow) params.set('openNow', '1');
  if (query.whatsapp) params.set('whatsapp', '1');
  if (query.page && query.page > 1) params.set('page', String(query.page));
  return params;
}

export async function fetchSearch(query: SearchQuery): Promise<SearchResult> {
  const params = searchQueryToParams(query);
  return readJson<SearchResult>(await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' }));
}

export async function fetchBusiness(idOrSlug: string): Promise<PublicBusiness> {
  const data = await readJson<{ business: PublicBusiness }>(
    await fetch(`/api/businesses/${encodeURIComponent(idOrSlug)}`, { cache: 'no-store' }),
  );
  return data.business;
}

export function parseSearchParams(searchParams: Record<string, string | string[] | undefined>): SearchQuery {
  const one = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const lat = one('lat');
  const lng = one('lng');
  const page = Number(one('page') ?? '1');
  return {
    q: one('q') || undefined,
    areaId: one('areaId') || undefined,
    lat: lat != null && lat !== '' ? Number(lat) : undefined,
    lng: lng != null && lng !== '' ? Number(lng) : undefined,
    categoryId: one('categoryId') || undefined,
    openNow: one('openNow') === '1' || one('openNow') === 'true',
    whatsapp: one('whatsapp') === '1' || one('whatsapp') === 'true',
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}
