import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '@/db/schema';

/**
 * Integration checks for the Phase 1 data model. Skipped unless DATABASE_URL is
 * set (CI sets it; run `docker compose up -d` locally). These assert the
 * database-level invariants the service layer relies on.
 */
const url = process.env.DATABASE_URL;

describe.skipIf(!url)('data model constraints', () => {
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });

  beforeAll(async () => {
    await db.execute(sql`select 1`);
  });
  afterEach(async () => {
    await db.execute(
      sql`truncate businesses, products_services, synonyms restart identity cascade`,
    );
  });
  afterAll(async () => {
    await pool.end();
  });

  /** Runs `fn`, expecting it to fail with a Postgres error naming `constraint`. */
  async function expectViolation(fn: () => Promise<unknown>, constraint: string) {
    try {
      await fn();
    } catch (error) {
      const cause = (error as { cause?: { constraint?: string } }).cause ?? error;
      expect((cause as { constraint?: string }).constraint).toBe(constraint);
      return;
    }
    throw new Error(`expected a "${constraint}" violation but the query succeeded`);
  }

  async function makeBusiness(name = 'Negocio de Prueba') {
    const [b] = await db
      .insert(schema.businesses)
      .values({ name, slug: `${name}-${crypto.randomUUID()}`.toLowerCase().replace(/\s+/g, '-') })
      .returning({ id: schema.businesses.id });
    return b.id;
  }

  it('normalises the business name into name_normalised', async () => {
    const id = await makeBusiness('Ferretería El Peñón');
    const row = await db.query.businesses.findFirst({
      where: (t, { eq }) => eq(t.id, id),
      columns: { nameNormalised: true },
    });
    expect(row?.nameNormalised).toBe('ferreteria el penon');
  });

  it('allows only one active premises per business', async () => {
    const businessId = await makeBusiness();
    await db.insert(schema.premises).values({ businessId, kind: 'physical', isActive: true });
    await expectViolation(
      () => db.insert(schema.premises).values({ businessId, kind: 'physical', isActive: true }),
      'premises_one_active_per_business',
    );
  });

  it('allows a second premises once it is not active', async () => {
    const businessId = await makeBusiness();
    await db.insert(schema.premises).values({ businessId, isActive: false });
    await expect(
      db.insert(schema.premises).values({ businessId, isActive: true }),
    ).resolves.toBeDefined();
  });

  it('allows only one primary category per business', async () => {
    const businessId = await makeBusiness();
    const [c1] = await db
      .insert(schema.categories)
      .values({ name: `Cat ${crypto.randomUUID()}`, slug: `cat-${crypto.randomUUID()}` })
      .returning({ id: schema.categories.id });
    const [c2] = await db
      .insert(schema.categories)
      .values({ name: `Cat ${crypto.randomUUID()}`, slug: `cat-${crypto.randomUUID()}` })
      .returning({ id: schema.categories.id });

    await db
      .insert(schema.businessCategories)
      .values({ businessId, categoryId: c1.id, isPrimary: true });
    await expectViolation(
      () =>
        db
          .insert(schema.businessCategories)
          .values({ businessId, categoryId: c2.id, isPrimary: true }),
      'business_categories_one_primary',
    );
  });

  it('rejects a global synonym that also targets a category', async () => {
    const [c] = await db
      .insert(schema.categories)
      .values({ name: `Cat ${crypto.randomUUID()}`, slug: `cat-${crypto.randomUUID()}` })
      .returning({ id: schema.categories.id });
    await expectViolation(
      () => db.insert(schema.synonyms).values({ term: 'x', scope: 'global', categoryId: c.id }),
      'synonyms_scope_target',
    );
  });

  it('rejects an opening-hours row outside ISO day range', async () => {
    const businessId = await makeBusiness();
    await expectViolation(
      () =>
        db
          .insert(schema.openingHours)
          .values({ businessId, dayOfWeek: 8, opensAt: '08:00', closesAt: '17:00' }),
      'opening_hours_day_of_week_range',
    );
  });
});
