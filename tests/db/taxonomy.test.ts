import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import type { AdminIdentity } from '@/lib/auth-guards';
import { updateSettings } from '@/lib/services/settings';
import {
  createCategory,
  createSynonym,
  deleteCategory,
  listCategories,
  reviewCategory,
} from '@/lib/services/taxonomy';
import {
  adminUsers,
  businessCategories,
  businesses,
  categories as categoriesTable,
} from '@/db/schema';

let owner: AdminIdentity;
let editor: AdminIdentity;

describe.skipIf(!process.env.DATABASE_URL)('taxonomy service', () => {
  beforeEach(async () => {
    await db.execute(
      sql`truncate businesses, categories, products_services, synonyms, admin_users, system_settings restart identity cascade`,
    );
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
    await updateSettings(
      { approvalRequiredCategories: true, approvalRequiredSynonyms: true },
      owner.adminId,
    );
  });
  afterEach(async () => {
    await db.execute(
      sql`truncate businesses, categories, products_services, synonyms, admin_users, system_settings restart identity cascade`,
    );
  });
  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('an owner-created category is approved immediately', async () => {
    const cat = await createCategory({ name: 'Ferreterías' }, owner);
    expect(cat.status).toBe('approved');
    expect(cat.slug).toBe('ferreterias');
  });

  it('an editor-created category is pending when approval is required', async () => {
    const cat = await createCategory({ name: 'Cerrajerías' }, editor);
    expect(cat.status).toBe('pending');
    expect(cat.requestedBy).toBe(editor.adminId);
  });

  it('an editor-created category is approved when approval is switched off', async () => {
    await updateSettings({ approvalRequiredCategories: false }, owner.adminId);
    const cat = await createCategory({ name: 'Vidrierías' }, editor);
    expect(cat.status).toBe('approved');
  });

  it('review approves and records the reviewer', async () => {
    const cat = await createCategory({ name: 'Cerrajerías' }, editor);
    const approved = await reviewCategory(cat.id, { decision: 'approve' }, owner);
    expect(approved.status).toBe('approved');
    expect(approved.reviewedBy).toBe(owner.adminId);
  });

  it('review can reject with a reason', async () => {
    const cat = await createCategory({ name: 'Cosa Rara' }, editor);
    const rejected = await reviewCategory(
      cat.id,
      { decision: 'reject', reason: 'Duplicada de Ferreterías' },
      owner,
    );
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toContain('Duplicada');
  });

  it('list filters by status and query', async () => {
    await createCategory({ name: 'Ferreterías' }, owner);
    await createCategory({ name: 'Panaderías' }, editor); // pending
    expect((await listCategories({ status: 'approved', limit: 50, offset: 0 })).length).toBe(1);
    expect((await listCategories({ q: 'panad', limit: 50, offset: 0 })).length).toBe(1);
  });

  it('refuses to delete a category assigned to a business', async () => {
    const cat = await createCategory({ name: 'Ferreterías' }, owner);
    const [biz] = await db
      .insert(businesses)
      .values({ name: 'Test', slug: `test-${crypto.randomUUID()}` })
      .returning({ id: businesses.id });
    await db
      .insert(businessCategories)
      .values({ businessId: biz.id, categoryId: cat.id, isPrimary: true });
    await expect(deleteCategory(cat.id)).rejects.toMatchObject({ code: 'in_use' });
  });

  it('rejects a scoped synonym whose target does not match its scope', async () => {
    await expect(
      createSynonym({ term: 'llavero', scope: 'category' }, owner),
    ).rejects.toBeInstanceOf(Error);
  });

  it('rejects a duplicate synonym for the same target', async () => {
    const [cat] = await db
      .insert(categoriesTable)
      .values({ name: 'Ferreterías', slug: `f-${crypto.randomUUID()}` })
      .returning({ id: categoriesTable.id });
    await createSynonym({ term: 'ferretería', scope: 'category', categoryId: cat.id }, owner);
    await expect(
      createSynonym({ term: 'Ferreteria', scope: 'category', categoryId: cat.id }, owner),
    ).rejects.toMatchObject({ code: 'already_exists' });
  });
});
