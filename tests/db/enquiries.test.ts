import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { adminUsers, businessMedia, businesses, enquiries, enquiryUploads } from '@/db/schema';
import type { AdminIdentity } from '@/lib/auth-guards';
import {
  createEnquiry,
  createEnquirySchema,
  getEnquiry,
  listEnquiries,
  reviewEnquiryUpload,
  updateEnquiry,
} from '@/lib/services/enquiries';

vi.mock('@/lib/blob', () => ({
  putObject: vi.fn(async (pathname: string, _b: unknown, contentType: string) => ({
    url: `https://blob.example/${pathname}`,
    pathname,
    contentType,
  })),
  deleteObject: vi.fn(async () => {}),
}));
const email = vi.hoisted(() => ({ sendEmail: vi.fn(async () => ({ sent: true })) }));
vi.mock('@/lib/email', () => email);

let actor: AdminIdentity;

const base = {
  type: 'add_business' as const,
  name: 'María Gómez',
  email: 'maria@example.com',
  message: 'Quiero añadir mi ferretería al directorio.',
  consent: true as const,
};

async function reset() {
  await db.execute(sql`truncate businesses, enquiries, admin_users restart identity cascade`);
}

describe.skipIf(!process.env.DATABASE_URL)('enquiries', () => {
  beforeEach(async () => {
    await reset();
    vi.clearAllMocks();
    const [a] = await db
      .insert(adminUsers)
      .values({ email: 'o@mk1.co', role: 'owner' })
      .returning();
    actor = { adminId: a.id, role: 'owner', email: a.email, name: null };
  });
  afterEach(reset);
  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('rejects a payload without consent at the schema', () => {
    expect(createEnquirySchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });

  it('stores an enquiry with the consent version and notifies', async () => {
    const res = await createEnquiry(base, { ipHash: 'h1', userAgent: 'ua' });
    expect(res.accepted).toBe(true);
    const row = await db.query.enquiries.findFirst({ where: (t, { eq }) => eq(t.id, res.id!) });
    expect(row?.consentGiven).toBe(true);
    expect(row?.consentPolicyVersion).toBe('1');
    expect(row?.consentAt).not.toBeNull();
    expect(email.sendEmail).toHaveBeenCalledOnce();
  });

  it('silently drops a honeypot submission', async () => {
    const res = await createEnquiry({ ...base, company: 'spammer' } as never, {
      ipHash: 'h2',
      userAgent: null,
    });
    expect(res).toEqual({ id: null, accepted: true });
    expect(await listEnquiries({ includeDeleted: false, limit: 50, offset: 0 })).toHaveLength(0);
  });

  it('rate-limits by ip hash', async () => {
    for (let i = 0; i < 5; i += 1) {
      await createEnquiry(base, { ipHash: 'flood', userAgent: null });
    }
    await expect(createEnquiry(base, { ipHash: 'flood', userAgent: null })).rejects.toMatchObject({
      status: 429,
    });
  });

  it('accepts an image upload and rejects a bad type', async () => {
    const png = new File([new Uint8Array(8)], 'p.png', { type: 'image/png' });
    const res = await createEnquiry(base, { ipHash: 'h3', userAgent: null, file: png });
    const detail = await getEnquiry(res.id!);
    expect(detail.uploads).toHaveLength(1);
    expect(detail.uploads[0].reviewStatus).toBe('pending');

    const gif = new File([new Uint8Array(4)], 'x.gif', { type: 'image/gif' });
    await expect(
      createEnquiry(base, { ipHash: 'h4', userAgent: null, file: gif }),
    ).rejects.toMatchObject({ code: 'unsupported_type' });
  });

  it('lists and filters, hiding soft-deleted by default', async () => {
    await createEnquiry({ ...base, type: 'advertising' }, { ipHash: 'a', userAgent: null });
    const [b] = [
      await createEnquiry({ ...base, type: 'general' }, { ipHash: 'b', userAgent: null }),
    ];
    await db
      .update(enquiries)
      .set({ softDeletedAt: sql`now()` })
      .where(sql`id = ${b.id}`);

    expect(await listEnquiries({ includeDeleted: false, limit: 50, offset: 0 })).toHaveLength(1);
    expect(await listEnquiries({ includeDeleted: true, limit: 50, offset: 0 })).toHaveLength(2);
    expect(
      await listEnquiries({ type: 'advertising', includeDeleted: false, limit: 50, offset: 0 }),
    ).toHaveLength(1);
  });

  it('links an enquiry to a business and validates it', async () => {
    const { id } = await createEnquiry(base, { ipHash: 'h5', userAgent: null });
    await expect(
      updateEnquiry(id!, { businessId: crypto.randomUUID() }, actor),
    ).rejects.toMatchObject({ code: 'invalid_business' });

    const [biz] = await db
      .insert(businesses)
      .values({ name: 'Ferr', slug: `ferr-${crypto.randomUUID()}` })
      .returning();
    const updated = await updateEnquiry(id!, { businessId: biz.id, status: 'in_progress' }, actor);
    expect(updated.businessId).toBe(biz.id);
    expect(updated.status).toBe('in_progress');
    expect(updated.handledBy).toBe(actor.adminId);
  });

  it('approves an upload and promotes it to business media', async () => {
    const png = new File([new Uint8Array(8)], 'p.png', { type: 'image/png' });
    const { id } = await createEnquiry(base, { ipHash: 'h6', userAgent: null, file: png });
    const [upload] = await db
      .select()
      .from(enquiryUploads)
      .where(sql`enquiry_id = ${id}`);
    const [biz] = await db
      .insert(businesses)
      .values({ name: 'Ferr', slug: `ferr-${crypto.randomUUID()}` })
      .returning();

    const reviewed = await reviewEnquiryUpload(
      upload.id,
      { decision: 'approve', promoteToBusinessId: biz.id, promoteAs: 'logo' },
      actor,
    );
    expect(reviewed.reviewStatus).toBe('approved');
    expect(reviewed.promotedMediaId).not.toBeNull();

    const media = await db
      .select()
      .from(businessMedia)
      .where(sql`business_id = ${biz.id}`);
    expect(media[0].source).toBe('enquiry');
    expect(media[0].reviewStatus).toBe('approved');
    expect(media[0].type).toBe('logo');
  });
});
