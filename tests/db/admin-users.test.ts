import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { createAdminUser, listAdminUsers, updateAdminUser } from '@/lib/services/admin-users';

/**
 * Admin-user management rules (scope §26). Skipped unless DATABASE_URL is set.
 */
describe.skipIf(!process.env.DATABASE_URL)('admin users service', () => {
  beforeEach(async () => {
    await db.execute(sql`truncate admin_users restart identity cascade`);
  });
  afterEach(async () => {
    await db.execute(sql`truncate admin_users restart identity cascade`);
  });
  afterAll(async () => {
    // node-postgres pool from the shared client; closing keeps vitest from hanging.
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('normalises the email and rejects duplicates', async () => {
    const created = await createAdminUser({ email: '  Owner@MK1.CO ', role: 'owner' });
    expect(created.email).toBe('owner@mk1.co');
    await expect(createAdminUser({ email: 'owner@mk1.co', role: 'editor' })).rejects.toMatchObject({
      status: 409,
      code: 'already_exists',
    });
  });

  it('will not let the last active owner drop owner access', async () => {
    const owner = await createAdminUser({ email: 'a@mk1.co', role: 'owner' });
    const editor = await createAdminUser({ email: 'b@mk1.co', role: 'editor' });

    await expect(updateAdminUser(owner.id, editor.id, { role: 'editor' })).rejects.toMatchObject({
      code: 'last_owner',
    });

    // With a second owner it is allowed.
    const owner2 = await createAdminUser({ email: 'c@mk1.co', role: 'owner' });
    const updated = await updateAdminUser(owner.id, owner2.id, { role: 'editor' });
    expect(updated.role).toBe('editor');
  });

  it('will not let an owner lock themselves out', async () => {
    const owner = await createAdminUser({ email: 'a@mk1.co', role: 'owner' });
    await createAdminUser({ email: 'b@mk1.co', role: 'owner' });
    await expect(updateAdminUser(owner.id, owner.id, { isActive: false })).rejects.toMatchObject({
      code: 'self_lockout',
    });
  });

  it('lists users alphabetically by email', async () => {
    await createAdminUser({ email: 'zed@mk1.co', role: 'editor' });
    await createAdminUser({ email: 'amy@mk1.co', role: 'owner' });
    const rows = await listAdminUsers();
    expect(rows.map((r) => r.email)).toEqual(['amy@mk1.co', 'zed@mk1.co']);
  });
});
