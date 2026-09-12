import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  areas,
  businessCategories,
  businessProductsServices,
  businesses,
  categories,
  importBatches,
  importRows,
  internalNotes,
  premises,
  productsServices,
} from '@/db/schema';
import { HttpError } from '@/lib/http';
import { parseCsv, toCsv } from '@/lib/csv';
import { parseXlsx, toXlsxBuffer } from '@/lib/xlsx';
import { normaliseSearchText } from '@/lib/text';
import { uniqueSlug } from '@/lib/slug';
import type { AdminIdentity } from '@/lib/auth-guards';

/**
 * Business CSV/Excel import & export (scope §31).
 *
 * Import never publishes anything: every committed row becomes a `draft`
 * business, so the normal publish-minimum validation (Phase 3) still gates
 * whether it ever goes live. Rows that fail the draft-minimum checks below are
 * held back for the operator to fix and never touch the database.
 */

export const IMPORT_COLUMNS = [
  'name',
  'phone',
  'whatsapp',
  'email',
  'website',
  'instagram',
  'facebook',
  'primaryCategory',
  'secondaryCategories',
  'productsServices',
  'area',
  'premisesKind',
  'addressLine',
  'serviceAreaNote',
  'lat',
  'lng',
  'sourceNote',
] as const;

export const EXPORT_COLUMNS = [
  'id',
  'slug',
  'status',
  ...IMPORT_COLUMNS.filter((c) => c !== 'sourceNote'),
  'lastVerifiedAt',
] as const;

type RawRow = Record<string, string>;

function gridToRawRows(grid: string[][]): RawRow[] {
  if (grid.length === 0) return [];
  const header = grid[0].map((h) => h.trim());
  return grid.slice(1).map((cells) => {
    const row: RawRow = {};
    header.forEach((key, i) => {
      if (key) row[key] = (cells[i] ?? '').trim();
    });
    return row;
  });
}

async function parseFile(buffer: ArrayBuffer, format: 'csv' | 'xlsx'): Promise<RawRow[]> {
  const grid =
    format === 'csv' ? parseCsv(new TextDecoder('utf-8').decode(buffer)) : await parseXlsx(buffer);
  return gridToRawRows(grid);
}

// --- Vocabulary lookup (preloaded once per batch for cheap in-memory resolution) --

type Lookup = Map<string, { id: string; label: string }>;

function toLookup(rows: { id: string; name: string; slug: string }[]): Lookup {
  const map: Lookup = new Map();
  for (const r of rows) {
    map.set(normaliseSearchText(r.name), { id: r.id, label: r.name });
    map.set(r.slug.toLowerCase(), { id: r.id, label: r.name });
  }
  return map;
}

async function loadVocabulary() {
  const [cats, prods, areaRows] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(eq(categories.status, 'approved')),
    db
      .select({ id: productsServices.id, name: productsServices.name, slug: productsServices.slug })
      .from(productsServices)
      .where(eq(productsServices.status, 'approved')),
    db
      .select({ id: areas.id, name: areas.name, slug: areas.slug })
      .from(areas)
      .where(eq(areas.isActive, true)),
  ]);
  return { categories: toLookup(cats), products: toLookup(prods), areas: toLookup(areaRows) };
}

function resolveOne(lookup: Lookup, value: string): { id: string; label: string } | undefined {
  const key = value.trim();
  if (!key) return undefined;
  return lookup.get(normaliseSearchText(key)) ?? lookup.get(key.toLowerCase());
}

function resolveMany(lookup: Lookup, value: string) {
  const ids: string[] = [];
  const skipped: string[] = [];
  for (const part of value
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)) {
    const hit = resolveOne(lookup, part);
    if (hit) ids.push(hit.id);
    else skipped.push(part);
  }
  return { ids, skipped };
}

export type RowValidation = {
  ok: boolean;
  errors: Record<string, string>;
  resolved: {
    primaryCategoryId?: string;
    secondaryCategoryIds: string[];
    productServiceIds: string[];
    areaId?: string;
    premisesKind: 'physical' | 'service_area';
    skipped: string[];
  };
};

function validateRow(
  raw: RawRow,
  vocab: Awaited<ReturnType<typeof loadVocabulary>>,
): RowValidation {
  const errors: Record<string, string> = {};
  const skipped: string[] = [];

  const name = raw.name?.trim();
  if (!name || name.length < 2) errors.name = 'Falta el nombre del negocio.';

  const primary = raw.primaryCategory
    ? resolveOne(vocab.categories, raw.primaryCategory)
    : undefined;
  if (!raw.primaryCategory?.trim()) {
    errors.primaryCategory = 'Falta la categoría principal.';
  } else if (!primary) {
    errors.primaryCategory = `Categoría no encontrada: "${raw.primaryCategory}".`;
  }

  const secondary = resolveMany(vocab.categories, raw.secondaryCategories ?? '');
  skipped.push(...secondary.skipped.map((s) => `categoría "${s}"`));

  const products = resolveMany(vocab.products, raw.productsServices ?? '');
  skipped.push(...products.skipped.map((s) => `producto/servicio "${s}"`));

  const areaHit = raw.area ? resolveOne(vocab.areas, raw.area) : undefined;
  if (raw.area && !areaHit) skipped.push(`área "${raw.area}"`);

  const kind: 'physical' | 'service_area' =
    raw.premisesKind === 'service_area' || (!raw.addressLine?.trim() && raw.serviceAreaNote?.trim())
      ? 'service_area'
      : 'physical';

  if (kind === 'service_area' && !raw.serviceAreaNote?.trim()) {
    errors.serviceAreaNote = 'Falta la zona de cobertura del servicio.';
  }
  if (!areaHit && kind === 'physical' && !raw.serviceAreaNote?.trim()) {
    errors.area = 'Falta el área/comunidad (o indique premisesKind=service_area con una zona).';
  }

  const hasContact = Boolean(
    raw.phone?.trim() || raw.whatsapp?.trim() || raw.email?.trim() || raw.website?.trim(),
  );
  if (!hasContact && !raw.sourceNote?.trim()) {
    errors.contact = 'Falta un contacto público o una nota de origen.';
  }

  if ((raw.lat?.trim() || raw.lng?.trim()) && !(raw.lat?.trim() && raw.lng?.trim())) {
    errors.lat = 'Debe indicar latitud y longitud juntas.';
  } else if (raw.lat?.trim() && raw.lng?.trim()) {
    const lat = Number(raw.lat);
    const lng = Number(raw.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.lat = 'Latitud inválida.';
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.lng = 'Longitud inválida.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    resolved: {
      primaryCategoryId: primary?.id,
      secondaryCategoryIds: secondary.ids,
      productServiceIds: products.ids,
      areaId: areaHit?.id,
      premisesKind: kind,
      skipped,
    },
  };
}

// --- Batch lifecycle ---------------------------------------------------------

export async function createImportBatch(file: File, format: 'csv' | 'xlsx', actor: AdminIdentity) {
  const rawRows = await parseFile(await file.arrayBuffer(), format);
  if (rawRows.length === 0) {
    throw new HttpError(422, 'empty_file', 'El archivo no tiene filas de datos.');
  }
  if (rawRows.length > 2000) {
    throw new HttpError(422, 'too_many_rows', 'El archivo supera el máximo de 2000 filas.');
  }

  const vocab = await loadVocabulary();
  const validations = rawRows.map((raw) => validateRow(raw, vocab));
  const validCount = validations.filter((v) => v.ok).length;

  const batch = await db.transaction(async (tx) => {
    const [b] = await tx
      .insert(importBatches)
      .values({
        filename: file.name,
        format,
        totalRows: rawRows.length,
        validRows: validCount,
        errorRows: rawRows.length - validCount,
        createdBy: actor.adminId,
      })
      .returning();

    await tx.insert(importRows).values(
      rawRows.map((raw, i) => ({
        batchId: b.id,
        rowNumber: i + 1,
        raw,
        ok: validations[i].ok,
        errors: validations[i].ok ? null : validations[i].errors,
        resolved: validations[i].resolved,
      })),
    );
    return b;
  });

  return batch;
}

export const listImportRowsQuerySchema = z.object({
  onlyErrors: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function getImportBatch(id: string) {
  const batch = await db.query.importBatches.findFirst({ where: eq(importBatches.id, id) });
  if (!batch) throw new HttpError(404, 'not_found', 'Importación no encontrada.');
  return batch;
}

export async function listImportRows(
  batchId: string,
  query: z.infer<typeof listImportRowsQuerySchema>,
) {
  await getImportBatch(batchId);
  return db
    .select()
    .from(importRows)
    .where(
      and(eq(importRows.batchId, batchId), query.onlyErrors ? eq(importRows.ok, false) : undefined),
    )
    .orderBy(asc(importRows.rowNumber))
    .limit(query.limit)
    .offset(query.offset);
}

export async function discardImportBatch(id: string) {
  const batch = await getImportBatch(id);
  if (batch.status !== 'pending_review') {
    throw new HttpError(409, 'invalid_state', 'Solo se puede descartar una importación pendiente.');
  }
  const [row] = await db
    .update(importBatches)
    .set({ status: 'discarded', updatedAt: sql`now()` })
    .where(eq(importBatches.id, id))
    .returning();
  return row;
}

/** Creates a draft business (+ premises/links/note) for one already-validated row. */
async function commitRow(
  row: typeof importRows.$inferSelect,
  actor: AdminIdentity,
): Promise<string> {
  const raw = row.raw;
  const resolved = row.resolved as RowValidation['resolved'];
  const name = raw.name.trim();
  const slug = await uniqueSlug(name, async (s) => {
    const hit = await db.query.businesses.findFirst({
      where: eq(businesses.slug, s),
      columns: { id: true },
    });
    return Boolean(hit);
  });

  return db.transaction(async (tx) => {
    const [business] = await tx
      .insert(businesses)
      .values({
        name,
        slug,
        phone: raw.phone?.trim() || null,
        whatsapp: raw.whatsapp?.trim() || null,
        email: raw.email?.trim() || null,
        website: raw.website?.trim() || null,
        instagram: raw.instagram?.trim() || null,
        facebook: raw.facebook?.trim() || null,
        createdBy: actor.adminId,
        updatedBy: actor.adminId,
      })
      .returning();

    if (resolved.primaryCategoryId) {
      const categoryIds = [resolved.primaryCategoryId, ...resolved.secondaryCategoryIds];
      await tx.insert(businessCategories).values(
        [...new Set(categoryIds)].map((categoryId) => ({
          businessId: business.id,
          categoryId,
          isPrimary: categoryId === resolved.primaryCategoryId,
        })),
      );
    }
    if (resolved.productServiceIds.length > 0) {
      await tx.insert(businessProductsServices).values(
        resolved.productServiceIds.map((productServiceId) => ({
          businessId: business.id,
          productServiceId,
        })),
      );
    }

    const lat = raw.lat?.trim() ? Number(raw.lat) : undefined;
    const lng = raw.lng?.trim() ? Number(raw.lng) : undefined;
    if (
      resolved.areaId ||
      raw.addressLine?.trim() ||
      raw.serviceAreaNote?.trim() ||
      lat !== undefined
    ) {
      await tx.insert(premises).values({
        businessId: business.id,
        kind: resolved.premisesKind,
        areaId: resolved.areaId ?? null,
        addressLine: resolved.premisesKind === 'physical' ? raw.addressLine?.trim() || null : null,
        serviceAreaNote:
          resolved.premisesKind === 'service_area' ? raw.serviceAreaNote?.trim() || null : null,
        location:
          lat !== undefined && lng !== undefined
            ? sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`
            : null,
        locationPrecision: lat !== undefined ? 'approximate' : null,
        isActive: true,
      });
    }

    const noteLines = [
      `Importado el ${new Date().toISOString().slice(0, 10)}.`,
      raw.sourceNote?.trim() ? `Nota de origen: ${raw.sourceNote.trim()}` : null,
      resolved.skipped.length > 0 ? `No se pudo asociar: ${resolved.skipped.join(', ')}.` : null,
    ].filter(Boolean);
    await tx.insert(internalNotes).values({
      businessId: business.id,
      authorId: actor.adminId,
      body: noteLines.join(' '),
    });

    await tx
      .update(importRows)
      .set({ businessId: business.id, committedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(importRows.id, row.id));

    return business.id;
  });
}

export async function commitImportBatch(id: string, actor: AdminIdentity) {
  const batch = await getImportBatch(id);
  if (batch.status !== 'pending_review') {
    throw new HttpError(409, 'invalid_state', 'Esta importación ya fue confirmada o descartada.');
  }

  const rows = await db
    .select()
    .from(importRows)
    .where(and(eq(importRows.batchId, id), eq(importRows.ok, true)));

  let committed = 0;
  for (const row of rows) {
    if (row.businessId) continue; // already committed (defensive; not expected here)
    await commitRow(row, actor);
    committed += 1;
  }

  const [updated] = await db
    .update(importBatches)
    .set({
      status: 'committed',
      committedBy: actor.adminId,
      committedAt: sql`now()`,
      committedRows: committed,
      updatedAt: sql`now()`,
    })
    .where(eq(importBatches.id, id))
    .returning();
  return updated;
}

export async function listImportBatches() {
  return db.select().from(importBatches).orderBy(desc(importBatches.createdAt)).limit(50);
}

// --- Export -------------------------------------------------------------------

export const exportBusinessesQuerySchema = z.object({
  format: z.enum(['csv', 'xlsx']).default('csv'),
  status: z.enum(businesses.status.enumValues).optional(),
});

export async function exportBusinesses(
  query: z.infer<typeof exportBusinessesQuerySchema>,
): Promise<{ buffer: Buffer | string; contentType: string; filename: string }> {
  const rows = await db.execute<{
    id: string;
    slug: string;
    status: string;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    primary_category: string | null;
    secondary_categories: string | null;
    products_services: string | null;
    area: string | null;
    premises_kind: string | null;
    address_line: string | null;
    service_area_note: string | null;
    lat: number | null;
    lng: number | null;
    last_verified_at: string | null;
  }>(sql`
    select b.id, b.slug, b.status, b.name, b.phone, b.whatsapp, b.email, b.website,
      b.instagram, b.facebook,
      pc.name as primary_category,
      (
        select string_agg(c.name, ', ') from business_categories bc2
        join categories c on c.id = bc2.category_id
        where bc2.business_id = b.id and bc2.is_primary = false
      ) as secondary_categories,
      (
        select string_agg(ps.name, ', ') from business_products_services bps
        join products_services ps on ps.id = bps.product_service_id
        where bps.business_id = b.id
      ) as products_services,
      ar.name as area, prem.kind as premises_kind, prem.address_line,
      prem.service_area_note,
      ST_Y(prem.location::geometry) as lat, ST_X(prem.location::geometry) as lng,
      b.last_verified_at
    from businesses b
    left join lateral (
      select c.name from business_categories bc join categories c on c.id = bc.category_id
      where bc.business_id = b.id and bc.is_primary limit 1
    ) pc on true
    left join lateral (
      select * from premises p where p.business_id = b.id and p.is_active limit 1
    ) prem on true
    left join areas ar on ar.id = prem.area_id
    where b.status not in ('archived')
      ${query.status ? sql`and b.status = ${query.status}` : sql``}
    order by b.name
  `);

  const grid: unknown[][] = [
    [...EXPORT_COLUMNS],
    ...rows.rows.map((r) => [
      r.id,
      r.slug,
      r.status,
      r.name,
      r.phone,
      r.whatsapp,
      r.email,
      r.website,
      r.instagram,
      r.facebook,
      r.primary_category,
      r.secondary_categories,
      r.products_services,
      r.area,
      r.premises_kind,
      r.address_line,
      r.service_area_note,
      r.lat,
      r.lng,
      r.last_verified_at,
    ]),
  ];

  const date = new Date().toISOString().slice(0, 10);
  if (query.format === 'csv') {
    return {
      buffer: toCsv(grid),
      contentType: 'text/csv; charset=utf-8',
      filename: `negocios-${date}.csv`,
    };
  }
  return {
    buffer: await toXlsxBuffer(grid, 'Negocios'),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: `negocios-${date}.xlsx`,
  };
}
