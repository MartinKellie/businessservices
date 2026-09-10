import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  adminUsers,
  areas,
  businessCategories,
  businessMedia,
  businesses,
  categories,
  openingHours,
  premises,
} from '@/db/schema';
import { getPublicBusiness, listActiveAreas, listPublicCategories } from '@/lib/services/public';
import { updateSettings } from '@/lib/services/settings';

const ids: Record<string, string> = {};

describe.skipIf(!process.env.DATABASE_URL)('public read services', () => {
  beforeAll(async () => {
    await db.execute(
      sql`truncate businesses, areas, categories, admin_users, system_settings restart identity cascade`,
    );
    const [admin] = await db
      .insert(adminUsers)
      .values({ email: 'o@mk1.co', role: 'owner' })
      .returning();
    ids.admin = admin.id;

    const [cucuta] = await db
      .insert(areas)
      .values({
        name: 'Cúcuta',
        slug: 'cucuta',
        centroid: sql`ST_SetSRID(ST_MakePoint(-72.5078, 7.8939), 4326)::geography`,
      })
      .returning();
    await db.insert(areas).values({ name: 'Inactiva', slug: 'inactiva', isActive: false });
    ids.cucuta = cucuta.id;

    const [ferr] = await db
      .insert(categories)
      .values({ name: 'Ferreterías', slug: 'ferreterias', isPopular: true, fallbackIcon: 'hammer' })
      .returning();
    await db.insert(categories).values({ name: 'Pendiente', slug: 'pendiente', status: 'pending' });
    ids.ferr = ferr.id;

    const [shop] = await db
      .insert(businesses)
      .values({
        name: 'Ferretería El Peñón',
        slug: 'ferreteria-el-penon',
        status: 'active',
        phone: '3001234567',
        updatedBy: admin.id,
      })
      .returning();
    ids.shop = shop.id;
    await db
      .insert(businessCategories)
      .values({ businessId: shop.id, categoryId: ferr.id, isPrimary: true });
    await db.insert(premises).values({
      businessId: shop.id,
      kind: 'physical',
      areaId: cucuta.id,
      addressLine: 'Av. 5 #10-20, Barrio Centro',
      location: sql`ST_SetSRID(ST_MakePoint(-72.5081, 7.8941), 4326)::geography`,
      isActive: true,
    });
    await db.insert(openingHours).values([
      { businessId: shop.id, dayOfWeek: 1, opensAt: '08:00', closesAt: '18:00' },
      { businessId: shop.id, dayOfWeek: 2, opensAt: '08:00', closesAt: '18:00' },
    ]);
    await db.insert(businessMedia).values([
      {
        businessId: shop.id,
        type: 'photo',
        blobUrl: 'https://blob/approved.jpg',
        blobPathname: 'approved.jpg',
        reviewStatus: 'approved',
      },
      {
        businessId: shop.id,
        type: 'photo',
        blobUrl: 'https://blob/pending.jpg',
        blobPathname: 'pending.jpg',
        reviewStatus: 'pending',
      },
    ]);

    await db
      .insert(businesses)
      .values({ name: 'Borrador SA', slug: 'borrador-sa', status: 'draft' });
  });

  beforeEach(async () => {
    await updateSettings({ publicLastUpdatedVisible: false, maintenanceMode: false }, ids.admin);
  });

  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('lists only active areas with coordinates', async () => {
    const list = await listActiveAreas();
    expect(list.map((a) => a.slug)).toEqual(['cucuta']);
    expect(list[0].lat).toBeCloseTo(7.8939, 3);
  });

  it('lists approved categories with a discoverable-business count', async () => {
    const all = await listPublicCategories();
    const ferr = all.find((c) => c.slug === 'ferreterias');
    expect(ferr?.businessCount).toBe(1);
    expect(all.some((c) => c.slug === 'pendiente')).toBe(false);

    const popular = await listPublicCategories({ popularOnly: true });
    expect(popular.map((c) => c.slug)).toEqual(['ferreterias']);
  });

  it('returns full detail including the address and approved photos only', async () => {
    const b = await getPublicBusiness('ferreteria-el-penon');
    expect(b.address).toBe('Av. 5 #10-20, Barrio Centro');
    expect(b.location).toMatchObject({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(b.area?.slug).toBe('cucuta');
    expect(b.openingHours).toHaveLength(2);
    expect(b.photoUrls).toEqual(['https://blob/approved.jpg']);
    expect(b.primaryCategory?.slug).toBe('ferreterias');
  });

  it('hides "última actualización" unless the setting is on', async () => {
    expect((await getPublicBusiness(ids.shop)).lastUpdatedAt).toBeNull();
    await updateSettings({ publicLastUpdatedVisible: true }, ids.admin);
    expect((await getPublicBusiness(ids.shop)).lastUpdatedAt).not.toBeNull();
  });

  it('404s for a draft or unknown business', async () => {
    await expect(getPublicBusiness('borrador-sa')).rejects.toMatchObject({ status: 404 });
    await expect(getPublicBusiness('no-existe')).rejects.toMatchObject({ status: 404 });
  });
});
