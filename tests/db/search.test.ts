import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  adminUsers,
  areas,
  businessCategories,
  businessProductsServices,
  businesses,
  categories,
  openingHours,
  premises,
  productsServices,
  synonyms,
} from '@/db/schema';
import { search, searchPreview, resolveVocabulary } from '@/lib/services/search';
import { updateSettings } from '@/lib/services/settings';

type Ids = Record<string, string>;
const area: Ids = {};
const cat: Ids = {};
const concept: Ids = {};
const biz: Ids = {};

async function makeBusiness(opts: {
  key: string;
  name: string;
  status?: 'active' | 'temporarily_closed' | 'permanently_closed' | 'draft';
  areaKey?: string;
  categoryKey?: string;
  conceptKeys?: string[];
  whatsapp?: string;
  lat?: number;
  lng?: number;
  alwaysOpen?: boolean;
}) {
  const [b] = await db
    .insert(businesses)
    .values({
      name: opts.name,
      slug: `${opts.key}-${crypto.randomUUID()}`,
      status: opts.status ?? 'active',
      whatsapp: opts.whatsapp ?? null,
    })
    .returning();
  biz[opts.key] = b.id;

  if (opts.categoryKey) {
    await db
      .insert(businessCategories)
      .values({ businessId: b.id, categoryId: cat[opts.categoryKey], isPrimary: true });
  }
  for (const ck of opts.conceptKeys ?? []) {
    await db
      .insert(businessProductsServices)
      .values({ businessId: b.id, productServiceId: concept[ck] });
  }
  const point =
    opts.lat !== undefined && opts.lng !== undefined
      ? sql`ST_SetSRID(ST_MakePoint(${opts.lng}, ${opts.lat}), 4326)::geography`
      : null;
  await db.insert(premises).values({
    businessId: b.id,
    kind: 'physical',
    areaId: opts.areaKey ? area[opts.areaKey] : null,
    location: point,
    addressLine: 'Calle 1',
    isActive: true,
  });
  if (opts.alwaysOpen) {
    await db.insert(openingHours).values(
      [1, 2, 3, 4, 5, 6, 7].map((d) => ({
        businessId: b.id,
        dayOfWeek: d,
        opensAt: '00:00',
        closesAt: '00:00',
      })),
    );
  }
  return b.id;
}

describe.skipIf(!process.env.DATABASE_URL)('search', () => {
  beforeAll(async () => {
    await db.execute(
      sql`truncate businesses, areas, categories, products_services, synonyms, admin_users, system_settings restart identity cascade`,
    );
    const [admin] = await db
      .insert(adminUsers)
      .values({ email: 'o@mk1.co', role: 'owner' })
      .returning();
    await updateSettings({ nearMeRadiusMeters: 3000 }, admin.id);

    for (const [key, name, lat, lng] of [
      ['cucuta', 'Cúcuta', 7.8939, -72.5078],
      ['patios', 'Los Patios', 7.833, -72.506],
    ] as const) {
      const [a] = await db
        .insert(areas)
        .values({
          name,
          slug: key,
          centroid: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`,
        })
        .returning();
      area[key] = a.id;
    }
    for (const [key, name] of [
      ['ferreterias', 'Ferreterías'],
      ['climatizacion', 'Climatización'],
    ] as const) {
      const [c] = await db.insert(categories).values({ name, slug: key }).returning();
      cat[key] = c.id;
    }
    for (const [key, name] of [
      ['agua', 'Dispensadores de agua'],
      ['aire', 'Aire acondicionado'],
    ] as const) {
      const [p] = await db.insert(productsServices).values({ name, slug: key }).returning();
      concept[key] = p.id;
    }
    for (const term of ['bebedero', 'botellón de agua', 'water cooler']) {
      await db
        .insert(synonyms)
        .values({ term, scope: 'product_service', productServiceId: concept.agua });
    }
    await db.insert(synonyms).values({ term: 'nevera', scope: 'global' });

    await makeBusiness({
      key: 'penon',
      name: 'Ferretería El Peñón',
      areaKey: 'cucuta',
      categoryKey: 'ferreterias',
      conceptKeys: ['agua'],
      whatsapp: '3001234567',
      lat: 7.894,
      lng: -72.508,
      alwaysOpen: true,
    });
    await makeBusiness({
      key: 'aguafria',
      name: 'AguaFría Distribuciones',
      areaKey: 'cucuta',
      conceptKeys: ['agua'],
      lat: 7.895,
      lng: -72.509,
    });
    await makeBusiness({
      key: 'climas',
      name: 'Climas del Norte',
      areaKey: 'patios',
      categoryKey: 'climatizacion',
      conceptKeys: ['aire'],
      lat: 7.833,
      lng: -72.506,
    });
    await makeBusiness({
      key: 'cerrada',
      name: 'Distribuidora Temporal',
      status: 'temporarily_closed',
      areaKey: 'cucuta',
      conceptKeys: ['agua'],
      lat: 7.8941,
      lng: -72.5081,
    });
    await makeBusiness({
      key: 'vieja',
      name: 'Vieja Fuente Cerrada',
      status: 'permanently_closed',
      areaKey: 'cucuta',
      conceptKeys: ['agua'],
      lat: 7.8942,
      lng: -72.5082,
    });
  });

  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('resolves a scoped synonym to its concept', async () => {
    const vocab = await resolveVocabulary('bebedero');
    expect(vocab.conceptMatches.map((m) => m.id)).toContain(concept.agua);
  });

  it('finds concept-linked businesses via a synonym, excluding unrelated ones', async () => {
    const { results } = await search({ q: 'bebedero', page: 1 });
    const names = results.map((r) => r.name);
    expect(names).toContain('Ferretería El Peñón');
    expect(names).toContain('AguaFría Distribuciones');
    expect(names).not.toContain('Climas del Norte');
  });

  it('tolerates missing accents and loose wording', async () => {
    const { results } = await search({ q: 'dispensador de agua', page: 1 });
    expect(results.map((r) => r.name)).toEqual(
      expect.arrayContaining(['Ferretería El Peñón', 'AguaFría Distribuciones']),
    );
  });

  it('ranks an exact-ish name match first', async () => {
    const { results } = await search({ q: 'ferreteria el penon', page: 1 });
    expect(results[0].name).toBe('Ferretería El Peñón');
  });

  it('demotes temporarily-closed below comparable active businesses', async () => {
    const { results } = await search({ q: 'bebedero', page: 1 });
    const idxActive = results.findIndex((r) => r.name === 'AguaFría Distribuciones');
    const idxClosed = results.findIndex((r) => r.name === 'Distribuidora Temporal');
    expect(idxClosed).toBeGreaterThan(idxActive);
    expect(results.find((r) => r.name === 'Distribuidora Temporal')?.status).toBe(
      'temporarily_closed',
    );
  });

  it('excludes permanently-closed from concept discovery but finds it by name', async () => {
    const discovery = await search({ q: 'bebedero', page: 1 });
    expect(discovery.results.map((r) => r.name)).not.toContain('Vieja Fuente Cerrada');

    const byName = await search({ q: 'vieja fuente', page: 1 });
    expect(byName.results.map((r) => r.name)).toContain('Vieja Fuente Cerrada');
  });

  it('applies the WhatsApp filter', async () => {
    const { results } = await search({ q: 'bebedero', whatsapp: true, page: 1 });
    expect(results.map((r) => r.name)).toEqual(['Ferretería El Peñón']);
  });

  it('applies the area filter', async () => {
    const { results } = await search({ q: 'aire acondicionado', areaId: area.patios, page: 1 });
    expect(results.map((r) => r.name)).toEqual(['Climas del Norte']);
    const none = await search({ q: 'aire acondicionado', areaId: area.cucuta, page: 1 });
    expect(none.results).toHaveLength(0);
  });

  it('applies the "Cerca de mí" radius and reports distance', async () => {
    const near = await search({ q: 'bebedero', lat: 7.894, lng: -72.508, page: 1 });
    expect(near.appliedRadiusMeters).toBe(3000);
    expect(near.results.every((r) => r.distanceMeters !== null)).toBe(true);

    const far = await search({ q: 'bebedero', lat: 8.5, lng: -72.9, page: 1 });
    expect(far.results).toHaveLength(0);
  });

  it('reports open status from opening hours', async () => {
    const { results } = await search({ q: 'bebedero', page: 1 });
    expect(results.find((r) => r.name === 'Ferretería El Peñón')?.openStatus).toBe('open');
    expect(results.find((r) => r.name === 'AguaFría Distribuciones')?.openStatus).toBeNull();
  });

  it('returns pins only for businesses with a location', async () => {
    const { pins } = await search({ q: 'bebedero', page: 1 });
    expect(pins.length).toBeGreaterThan(0);
    expect(pins.every((p) => typeof p.lat === 'number' && typeof p.lng === 'number')).toBe(true);
  });

  it('search-preview reports rank and match reason', async () => {
    const hit = await searchPreview(biz.penon, 'bebedero');
    expect(hit.appears).toBe(true);
    expect(hit.rank).toBeGreaterThanOrEqual(1);

    const miss = await searchPreview(biz.climas, 'bebedero');
    expect(miss.appears).toBe(false);
  });

  it('browse mode (no query) returns active businesses in the area by distance', async () => {
    const { results } = await search({ areaId: area.cucuta, page: 1 });
    const names = results.map((r) => r.name);
    expect(names).toContain('Ferretería El Peñón');
    expect(names).not.toContain('Vieja Fuente Cerrada'); // permanently closed
    expect(names).not.toContain('Climas del Norte'); // other area
  });
});
