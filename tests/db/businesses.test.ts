import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import type { AdminIdentity } from '@/lib/auth-guards';
import { adminUsers, areas, categories, productsServices } from '@/db/schema';
import {
  createBusiness,
  setActivePremises,
  setBusinessCategories,
  setBusinessProductsServices,
  updateBusiness,
} from '@/lib/services/businesses';
import { changeStatus, publishReadiness } from '@/lib/services/business-status';

let owner: AdminIdentity;
let editor: AdminIdentity;
let areaId: string;
let categoryId: string;
let productId: string;

async function reset() {
  await db.execute(
    sql`truncate businesses, admin_users, areas, categories, products_services restart identity cascade`,
  );
}

describe.skipIf(!process.env.DATABASE_URL)('business service', () => {
  beforeEach(async () => {
    await reset();
    const [o] = await db
      .insert(adminUsers)
      .values({ email: 'o@mk1.co', role: 'owner' })
      .returning();
    const [e] = await db
      .insert(adminUsers)
      .values({ email: 'e@mk1.co', role: 'editor' })
      .returning();
    owner = { adminId: o.id, role: 'owner', email: o.email, name: null };
    editor = { adminId: e.id, role: 'editor', email: e.email, name: null };
    const [a] = await db.insert(areas).values({ name: 'Cúcuta', slug: 'cucuta' }).returning();
    const [c] = await db
      .insert(categories)
      .values({ name: 'Ferreterías', slug: 'ferreterias' })
      .returning();
    const [p] = await db
      .insert(productsServices)
      .values({ name: 'Dispensadores de agua', slug: 'dispensadores' })
      .returning();
    areaId = a.id;
    categoryId = c.id;
    productId = p.id;
  });
  afterEach(reset);
  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('creates a business as a draft with a slug', async () => {
    const b = await createBusiness({ name: 'Ferretería El Peñón', phone: '3001234567' }, editor);
    expect(b.status).toBe('draft');
    expect(b.slug).toContain('ferreteria-el-penon');
  });

  it('lists the publish-minimum problems for an empty draft', async () => {
    const b = await createBusiness({ name: 'Sin Datos' }, editor);
    const problems = (await publishReadiness(b.id)).map((p) => p.field);
    expect(problems).toEqual(
      expect.arrayContaining(['contact', 'category', 'productsServices', 'premises']),
    );
  });

  it('refuses to publish a draft that fails the minimums', async () => {
    const b = await createBusiness({ name: 'Incompleto' }, editor);
    await expect(changeStatus(b.id, { status: 'active' }, owner)).rejects.toMatchObject({
      code: 'not_publishable',
    });
  });

  it('publishes once every minimum is satisfied', async () => {
    const b = await createBusiness({ name: 'Ferretería Central', whatsapp: '3007654321' }, editor);
    await setBusinessCategories(b.id, { primaryCategoryId: categoryId, secondaryCategoryIds: [] });
    await setBusinessProductsServices(b.id, { productServiceIds: [productId] });
    await setActivePremises(b.id, {
      kind: 'physical',
      addressLine: 'Av. 5 #10-20',
      areaId,
      lat: 7.89,
      lng: -72.5,
      locationPrecision: 'exact',
    });
    expect(await publishReadiness(b.id)).toEqual([]);
    const published = await changeStatus(b.id, { status: 'active' }, owner);
    expect(published.status).toBe('active');
  });

  it('rejects an invalid status transition', async () => {
    const b = await createBusiness({ name: 'X' }, editor);
    await expect(changeStatus(b.id, { status: 'temporarily_closed' }, owner)).rejects.toMatchObject(
      { code: 'invalid_transition' },
    );
  });

  it('only an owner can archive', async () => {
    const b = await createBusiness({ name: 'X' }, editor);
    await expect(changeStatus(b.id, { status: 'archived' }, editor)).rejects.toMatchObject({
      status: 403,
    });
    const archived = await changeStatus(b.id, { status: 'archived' }, owner);
    expect(archived.status).toBe('archived');
    expect(archived.deletedAt).not.toBeNull();
  });

  it('requires strong verification to change a contact channel', async () => {
    const b = await createBusiness({ name: 'X', phone: '3001112222' }, editor);
    await expect(updateBusiness(b.id, { phone: '3009998888' }, editor)).rejects.toMatchObject({
      code: 'verification_required',
    });

    const ok = await updateBusiness(
      b.id,
      { phone: '3009998888', verification: { level: 'visited', method: 'shop_visit' } },
      editor,
    );
    expect(ok.phone).toBe('3009998888');
    expect(ok.lastVerifiedAt).not.toBeNull();
  });

  it('enforces one primary category', async () => {
    const b = await createBusiness({ name: 'X' }, editor);
    const [c2] = await db
      .insert(categories)
      .values({ name: 'Panaderías', slug: 'panaderias' })
      .returning();
    await setBusinessCategories(b.id, {
      primaryCategoryId: categoryId,
      secondaryCategoryIds: [c2.id],
    });
    // Re-assigning replaces cleanly (no unique-violation on the partial index).
    await setBusinessCategories(b.id, {
      primaryCategoryId: c2.id,
      secondaryCategoryIds: [categoryId],
    });
  });
});
