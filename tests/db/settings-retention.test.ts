import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { adminUsers, businessMedia, businesses, enquiries, enquiryUploads } from '@/db/schema';
import { updateSettings, updateSettingsSchema } from '@/lib/services/settings';
import { runEnquiryRetention } from '@/lib/services/enquiries';

vi.mock('@/lib/blob', () => ({
  putObject: vi.fn(async () => ({ url: '', pathname: '', contentType: '' })),
  deleteObject: vi.fn(async () => {}),
}));
const blob = await import('@/lib/blob');

let ownerId: string;

async function reset() {
  await db.execute(
    sql`truncate enquiries, businesses, admin_users, system_settings restart identity cascade`,
  );
}

async function insertEnquiry(overrides: Partial<typeof enquiries.$inferInsert> = {}) {
  const [row] = await db
    .insert(enquiries)
    .values({
      type: 'general',
      name: 'X',
      email: 'x@example.com',
      message: 'mensaje de prueba suficientemente largo',
      consentGiven: true,
      consentPolicyVersion: '1',
      consentAt: sql`now()`,
      ...overrides,
    })
    .returning();
  return row;
}

describe.skipIf(!process.env.DATABASE_URL)('settings + retention', () => {
  beforeEach(async () => {
    await reset();
    vi.clearAllMocks();
    const [a] = await db
      .insert(adminUsers)
      .values({ email: 'o@mk1.co', role: 'owner' })
      .returning();
    ownerId = a.id;
  });
  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('rejects an empty settings patch', () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(false);
  });

  it('updates only the given settings fields', async () => {
    const updated = await updateSettings(
      { maintenanceMode: true, nearMeRadiusMeters: 2000 },
      ownerId,
    );
    expect(updated.maintenanceMode).toBe(true);
    expect(updated.nearMeRadiusMeters).toBe(2000);
    expect(updated.updatedBy).toBe(ownerId);
  });

  it('soft-deletes an enquiry past its retention period and leaves recent ones alone', async () => {
    await updateSettings({ enquiryRetentionMonths: 1, enquiryDeletionGraceDays: 30 }, ownerId);
    const old = await insertEnquiry();
    await db.execute(
      sql`update enquiries set created_at = now() - interval '2 months' where id = ${old.id}`,
    );
    const recent = await insertEnquiry();

    const result = await runEnquiryRetention();
    expect(result.softDeleted).toBe(1);

    const oldRow = await db.query.enquiries.findFirst({ where: (t, { eq }) => eq(t.id, old.id) });
    const recentRow = await db.query.enquiries.findFirst({
      where: (t, { eq }) => eq(t.id, recent.id),
    });
    expect(oldRow?.softDeletedAt).not.toBeNull();
    expect(oldRow?.purgeAfter).not.toBeNull();
    expect(recentRow?.softDeletedAt).toBeNull();
  });

  it('purges an enquiry past its grace period, deleting an un-promoted upload but not a promoted one', async () => {
    const purgeable = await insertEnquiry();
    await db.execute(
      sql`update enquiries set purge_after = now() - interval '1 day' where id = ${purgeable.id}`,
    );
    const kept = await insertEnquiry();

    const [biz] = await db
      .insert(businesses)
      .values({ name: 'X', slug: `x-${crypto.randomUUID()}` })
      .returning();
    const [media] = await db
      .insert(businessMedia)
      .values({ businessId: biz.id, type: 'photo', blobUrl: 'x', blobPathname: 'x' })
      .returning();
    await db.insert(enquiryUploads).values([
      { enquiryId: purgeable.id, blobUrl: 'a', blobPathname: 'a' }, // not promoted
      { enquiryId: purgeable.id, blobUrl: 'b', blobPathname: 'b', promotedMediaId: media.id },
    ]);

    const result = await runEnquiryRetention();
    expect(result.purged).toBe(1);
    expect(
      await db.query.enquiries.findFirst({ where: (t, { eq }) => eq(t.id, purgeable.id) }),
    ).toBeUndefined();
    expect(
      await db.query.enquiries.findFirst({ where: (t, { eq }) => eq(t.id, kept.id) }),
    ).toBeDefined();
    expect(blob.deleteObject).toHaveBeenCalledTimes(1);
    expect(blob.deleteObject).toHaveBeenCalledWith('a');
  });
});
