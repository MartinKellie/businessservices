import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { adminUsers, businessMedia, businesses } from '@/db/schema';
import type { AdminIdentity } from '@/lib/auth-guards';
import * as blob from '@/lib/blob';
import {
  deleteMedia,
  listBusinessMedia,
  reorderMedia,
  reviewMedia,
  uploadBusinessMedia,
} from '@/lib/services/media';

vi.mock('@/lib/blob', () => ({
  putObject: vi.fn(async (pathname: string, _body: unknown, contentType: string) => ({
    url: `https://blob.example/${pathname}`,
    pathname,
    contentType,
  })),
  deleteObject: vi.fn(async () => {}),
}));

let actor: AdminIdentity;
let businessId: string;

function pngFile(name = 'logo.png', bytes = 10) {
  return new File([new Uint8Array(bytes)], name, { type: 'image/png' });
}

async function reset() {
  await db.execute(sql`truncate businesses, admin_users restart identity cascade`);
}

describe.skipIf(!process.env.DATABASE_URL)('business media', () => {
  beforeEach(async () => {
    await reset();
    vi.clearAllMocks();
    const [a] = await db
      .insert(adminUsers)
      .values({ email: 'a@mk1.co', role: 'editor' })
      .returning();
    actor = { adminId: a.id, role: 'editor', email: a.email, name: null };
    const [b] = await db
      .insert(businesses)
      .values({ name: 'Foto SA', slug: `foto-${crypto.randomUUID()}` })
      .returning();
    businessId = b.id;
  });
  afterEach(reset);
  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('stores an admin upload as approved', async () => {
    const media = await uploadBusinessMedia(businessId, actor, pngFile(), { type: 'logo' });
    expect(blob.putObject).toHaveBeenCalledOnce();
    expect(media.reviewStatus).toBe('approved');
    expect(media.blobUrl).toContain('blob.example');
  });

  it('rejects a disallowed mime type', async () => {
    const gif = new File([new Uint8Array(4)], 'x.gif', { type: 'image/gif' });
    await expect(
      uploadBusinessMedia(businessId, actor, gif, { type: 'photo' }),
    ).rejects.toMatchObject({ code: 'unsupported_type' });
    expect(blob.putObject).not.toHaveBeenCalled();
  });

  it('reviews a pending image and can reject it', async () => {
    const [pending] = await db
      .insert(businessMedia)
      .values({
        businessId,
        type: 'photo',
        source: 'enquiry',
        blobUrl: 'https://blob.example/x',
        blobPathname: 'x',
        reviewStatus: 'pending',
      })
      .returning();
    const rejected = await reviewMedia(pending.id, { decision: 'reject' }, actor);
    expect(rejected.reviewStatus).toBe('rejected');
    expect(rejected.reviewedBy).toBe(actor.adminId);
  });

  it('deletes a row and the blob', async () => {
    const media = await uploadBusinessMedia(businessId, actor, pngFile(), { type: 'photo' });
    await deleteMedia(media.id);
    expect(blob.deleteObject).toHaveBeenCalledOnce();
    expect(await listBusinessMedia(businessId)).toHaveLength(0);
  });

  it('reorders media by the given id order', async () => {
    const a = await uploadBusinessMedia(businessId, actor, pngFile('a.png'), { type: 'photo' });
    const b = await uploadBusinessMedia(businessId, actor, pngFile('b.png'), { type: 'photo' });
    const ordered = await reorderMedia(businessId, { orderedIds: [b.id, a.id] });
    expect(ordered.map((m) => m.id)).toEqual([b.id, a.id]);
    expect(ordered.map((m) => m.sortOrder)).toEqual([0, 1]);
  });
});
