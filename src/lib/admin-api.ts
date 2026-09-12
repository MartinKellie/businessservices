import type { ApiError } from '@/lib/http';
import type { AdminRole } from '@/lib/roles';

export type BusinessStatus =
  'draft' | 'active' | 'temporarily_closed' | 'permanently_closed' | 'relocated' | 'archived';

export const STATUS_TRANSITIONS: Record<BusinessStatus, BusinessStatus[]> = {
  draft: ['active', 'archived'],
  active: ['temporarily_closed', 'permanently_closed', 'relocated', 'archived'],
  temporarily_closed: ['active', 'permanently_closed', 'relocated', 'archived'],
  permanently_closed: ['active', 'archived'],
  relocated: ['active', 'archived'],
  archived: ['draft'],
};

export const OWNER_ONLY_STATUS: BusinessStatus[] = ['permanently_closed', 'archived'];

export const HIGH_RISK_FIELDS = ['phone', 'whatsapp', 'email', 'website'] as const;
export const STRONG_VERIFICATION = ['phone_verified', 'visited', 'business_claimed'] as const;

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => null)) as (T & ApiError) | null;
  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      body && 'error' in body ? body.error.code : 'request_failed',
      body && 'error' in body ? body.error.message : 'Request failed.',
      body && 'error' in body ? body.error.fields : undefined,
    );
  }
  return body as T;
}

export async function adminGet<T>(path: string): Promise<T> {
  return readJson<T>(await fetch(path, { cache: 'no-store' }));
}

export async function adminSend<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  return readJson<T>(
    await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

export async function adminUpload<T>(path: string, form: FormData): Promise<T> {
  return readJson<T>(await fetch(path, { method: 'POST', body: form }));
}

export interface AdminBusiness {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  relocatedToBusinessId: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  verificationLevel: string | null;
  verificationMethod: string | null;
  lastVerifiedAt: string | null;
  verificationSource: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface AdminBusinessDetail extends AdminBusiness {
  categories: { id: string; name: string; slug: string; isPrimary: boolean }[];
  productsServices: { id: string; name: string; slug: string }[];
  premises: {
    id: string;
    kind: 'physical' | 'service_area';
    label: string | null;
    addressLine: string | null;
    areaId: string | null;
    serviceAreaNote: string | null;
    locationPrecision: 'exact' | 'approximate' | 'area_only' | null;
    lat: number | null;
    lng: number | null;
  } | null;
  openingHours: { id: string; dayOfWeek: number; opensAt: string; closesAt: string }[];
}

export interface PublishReport {
  publishable: boolean;
  problems: { field: string; message: string }[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  fallbackIcon: string | null;
  isPopular: boolean;
  status: 'pending' | 'approved' | 'rejected';
  sortOrder: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AdminSynonym {
  id: string;
  term: string;
  scope: 'global' | 'product_service' | 'category';
  productServiceId: string | null;
  categoryId: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AdminMedia {
  id: string;
  type: 'logo' | 'photo';
  blobUrl: string;
  altText: string | null;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  sortOrder: number;
}

export interface AdminNote {
  id: string;
  body: string;
  createdAt: string;
}

export interface AdminContactEntry {
  id: string;
  method: 'phone' | 'whatsapp' | 'email' | 'visit' | 'other';
  outcome: string | null;
  contactedOn: string;
  createdAt: string;
}

export interface AdminFollowUp {
  id: string;
  businessId: string;
  dueOn: string;
  note: string | null;
  overdue?: boolean;
  businessName?: string;
}

export interface AdminEnquiryRow {
  id: string;
  type: 'add_business' | 'update_listing' | 'advertising' | 'general';
  status: 'new' | 'in_progress' | 'closed';
  name: string;
  email: string;
  businessReference: string | null;
  createdAt: string;
  softDeletedAt: string | null;
  uploadCount: number;
}

export interface AdminEnquiry extends AdminEnquiryRow {
  phone: string | null;
  message: string;
  businessId: string | null;
  adminNotes: string | null;
  uploads: {
    id: string;
    blobUrl: string;
    reviewStatus: 'pending' | 'approved' | 'rejected';
    promotedMediaId: string | null;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface AdminSettings {
  approvalRequiredCategories: boolean;
  approvalRequiredProducts: boolean;
  approvalRequiredSynonyms: boolean;
  publicLastUpdatedVisible: boolean;
  nearMeRadiusMeters: number;
  maintenanceMode: boolean;
  announcementEnabled: boolean;
  announcementText: string;
  enquiryRetentionMonths: number;
  enquiryDeletionGraceDays: number;
  privacyPolicyVersion: string;
}

export interface ImportBatch {
  id: string;
  filename: string;
  format: 'csv' | 'xlsx';
  status: 'pending_review' | 'committed' | 'discarded';
  totalRows: number;
  validRows: number;
  errorRows: number;
  committedRows: number;
  createdAt: string;
}

export interface ImportRow {
  id: string;
  rowNumber: number;
  raw: Record<string, string>;
  ok: boolean;
  errors: Record<string, string> | null;
  resolved: Record<string, unknown> | null;
}

export interface SearchPreviewHit {
  appears: boolean;
  rank: number | null;
  total: number;
  matchedByName: boolean;
  score: number | null;
  resolved: { conceptIds: string[]; categoryIds: string[]; globalTerms: string[] };
}

export interface SearchPreviewList {
  total: number;
  resolved: { conceptIds: string[]; categoryIds: string[]; globalTerms: string[] };
  results: {
    rank: number;
    id: string;
    name: string;
    status: string;
    primaryCategory: string | null;
  }[];
}

export function dateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

export function timeInputValue(value: string): string {
  return value.slice(0, 5);
}
