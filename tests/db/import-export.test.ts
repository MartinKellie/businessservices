import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  adminUsers,
  areas,
  businessCategories,
  businesses,
  categories,
  importRows,
  premises,
  productsServices,
} from '@/db/schema';
import type { AdminIdentity } from '@/lib/auth-guards';
import { toCsv } from '@/lib/csv';
import {
  commitImportBatch,
  createImportBatch,
  discardImportBatch,
  exportBusinesses,
  getImportBatch,
  listImportRows,
} from '@/lib/services/import-export';

let owner: AdminIdentity;
let areaId: string;
let categoryId: string;
let productId: string;

function csvFile(rows: unknown[][], name = 'import.csv') {
  return new File([toCsv(rows)], name, { type: 'text/csv' });
}

const HEADER = [
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
];

function row(overrides: Record<string, string>) {
  const base: Record<string, string> = {
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    primaryCategory: '',
    secondaryCategories: '',
    productsServices: '',
    area: '',
    premisesKind: '',
    addressLine: '',
    serviceAreaNote: '',
    lat: '',
    lng: '',
    sourceNote: '',
    ...overrides,
  };
  return HEADER.map((h) => base[h]);
}

async function reset() {
  await db.execute(
    sql`truncate businesses, areas, categories, products_services, admin_users, import_batches restart identity cascade`,
  );
}

describe.skipIf(!process.env.DATABASE_URL)('import / export', () => {
  beforeEach(async () => {
    await reset();
    const [a] = await db
      .insert(adminUsers)
      .values({ email: 'o@mk1.co', role: 'owner' })
      .returning();
    owner = { adminId: a.id, role: 'owner', email: a.email, name: null };
    const [c] = await db
      .insert(categories)
      .values({ name: 'Ferreterías', slug: 'ferreterias' })
      .returning();
    const [p] = await db
      .insert(productsServices)
      .values({ name: 'Dispensadores de agua', slug: 'dispensadores' })
      .returning();
    const [ar] = await db.insert(areas).values({ name: 'Cúcuta', slug: 'cucuta' }).returning();
    categoryId = c.id;
    productId = p.id;
    areaId = ar.id;
  });
  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('validates rows: valid, missing name, missing category, unresolved category', async () => {
    const file = csvFile([
      HEADER,
      row({
        name: 'Ferretería El Peñón',
        phone: '3001234567',
        primaryCategory: 'Ferreterías',
        productsServices: 'Dispensadores de agua',
        area: 'Cúcuta',
        addressLine: 'Calle 1',
      }),
      row({ phone: '3000000000', primaryCategory: 'Ferreterías', area: 'Cúcuta' }), // no name
      row({ name: 'Sin Categoría', phone: '300', area: 'Cúcuta' }), // no category
      row({ name: 'Categoría Rara', phone: '300', primaryCategory: 'No Existe', area: 'Cúcuta' }),
    ]);

    const batch = await createImportBatch(file, 'csv', owner);
    expect(batch.totalRows).toBe(4);
    expect(batch.validRows).toBe(1);
    expect(batch.errorRows).toBe(3);

    const rows = await listImportRows(batch.id, { onlyErrors: true, limit: 50, offset: 0 });
    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.rowNumber === 2)?.errors).toHaveProperty('name');
    expect(rows.find((r) => r.rowNumber === 3)?.errors).toHaveProperty('primaryCategory');
    expect(rows.find((r) => r.rowNumber === 4)?.errors?.primaryCategory).toContain('No Existe');
  });

  it('is tolerant of an unresolved secondary category / product, recording it as skipped', async () => {
    const file = csvFile([
      HEADER,
      row({
        name: 'Ferretería El Peñón',
        phone: '3001234567',
        primaryCategory: 'Ferreterías',
        secondaryCategories: 'No Existe',
        productsServices: 'Dispensadores de agua, Otro Inexistente',
        area: 'Cúcuta',
      }),
    ]);
    const batch = await createImportBatch(file, 'csv', owner);
    expect(batch.validRows).toBe(1);
    const [r] = await listImportRows(batch.id, { onlyErrors: false, limit: 50, offset: 0 });
    const resolved = r.resolved as { skipped: string[]; productServiceIds: string[] };
    expect(resolved.skipped.join(' ')).toContain('No Existe');
    expect(resolved.skipped.join(' ')).toContain('Otro Inexistente');
    expect(resolved.productServiceIds).toEqual([productId]);
  });

  it('accepts accent/case-insensitive and slug matches', async () => {
    const file = csvFile([
      HEADER,
      row({ name: 'Negocio A', phone: '1', primaryCategory: 'ferreterias', area: 'cucuta' }),
      row({ name: 'Negocio B', phone: '1', primaryCategory: 'FERRETERÍAS', area: 'CÚCUTA' }),
    ]);
    const batch = await createImportBatch(file, 'csv', owner);
    expect(batch.validRows).toBe(2);
  });

  it('commits only valid rows into draft businesses with links, premises and a note', async () => {
    const file = csvFile([
      HEADER,
      row({
        name: 'Ferretería El Peñón',
        phone: '3001234567',
        primaryCategory: 'Ferreterías',
        productsServices: 'Dispensadores de agua',
        area: 'Cúcuta',
        addressLine: 'Calle 1',
        lat: '7.89',
        lng: '-72.5',
        sourceNote: 'Visita de campo',
      }),
      row({ name: 'Sin Categoría', phone: '300', area: 'Cúcuta' }),
    ]);
    const batch = await createImportBatch(file, 'csv', owner);
    const committed = await commitImportBatch(batch.id, owner);
    expect(committed.status).toBe('committed');
    expect(committed.committedRows).toBe(1);

    const created = await db.query.businesses.findFirst({
      where: (t, { eq }) => eq(t.name, 'Ferretería El Peñón'),
    });
    expect(created?.status).toBe('draft');

    const cats = await db
      .select()
      .from(businessCategories)
      .where(sql`business_id = ${created!.id}`);
    expect(cats).toHaveLength(1);
    expect(cats[0].isPrimary).toBe(true);

    const prem = await db
      .select()
      .from(premises)
      .where(sql`business_id = ${created!.id}`);
    expect(prem).toHaveLength(1);
    expect(prem[0].addressLine).toBe('Calle 1');

    const rows = await db
      .select()
      .from(importRows)
      .where(sql`batch_id = ${batch.id}`);
    expect(rows.find((r) => r.rowNumber === 1)?.businessId).toBe(created!.id);
    expect(rows.find((r) => r.rowNumber === 2)?.businessId).toBeNull();
  });

  it('refuses to commit or discard twice', async () => {
    const file = csvFile([
      HEADER,
      row({ name: 'X', phone: '1', primaryCategory: 'Ferreterías', area: 'Cúcuta' }),
    ]);
    const batch = await createImportBatch(file, 'csv', owner);
    await commitImportBatch(batch.id, owner);
    await expect(commitImportBatch(batch.id, owner)).rejects.toMatchObject({
      code: 'invalid_state',
    });
    await expect(discardImportBatch(batch.id)).rejects.toMatchObject({ code: 'invalid_state' });
  });

  it('discards a pending batch without creating businesses', async () => {
    const file = csvFile([
      HEADER,
      row({ name: 'X', phone: '1', primaryCategory: 'Ferreterías', area: 'Cúcuta' }),
    ]);
    const batch = await createImportBatch(file, 'csv', owner);
    const discarded = await discardImportBatch(batch.id);
    expect(discarded.status).toBe('discarded');
    await expect(commitImportBatch(batch.id, owner)).rejects.toMatchObject({
      code: 'invalid_state',
    });
    expect(await getImportBatch(batch.id)).toMatchObject({ status: 'discarded' });
  });

  it('exports active/draft businesses to CSV with the expected columns', async () => {
    await db.insert(businesses).values({
      name: 'Exportable SA',
      slug: `exp-${crypto.randomUUID()}`,
      status: 'draft',
    });
    const { buffer, contentType, filename } = await exportBusinesses({ format: 'csv' });
    expect(contentType).toContain('text/csv');
    expect(filename).toMatch(/\.csv$/);
    expect(String(buffer)).toContain('Exportable SA');
    expect(String(buffer).split('\r\n')[0]).toContain('primaryCategory');
  });

  it('exports to xlsx', async () => {
    await db.insert(businesses).values({
      name: 'Exportable XLSX',
      slug: `expx-${crypto.randomUUID()}`,
      status: 'draft',
    });
    const { buffer, contentType, filename } = await exportBusinesses({ format: 'xlsx' });
    expect(contentType).toContain('spreadsheetml');
    expect(filename).toMatch(/\.xlsx$/);
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });
});
