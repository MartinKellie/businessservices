import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import type { AdminIdentity } from '@/lib/auth-guards';
import { adminUsers, businesses } from '@/db/schema';
import { getOpeningHours, setOpeningHours } from '@/lib/services/opening-hours';
import {
  addContactEntry,
  addNote,
  completeFollowUp,
  listOpenFollowUps,
  setFollowUp,
} from '@/lib/services/business-ops';

let actor: AdminIdentity;
let businessId: string;
let otherBusinessId: string;

async function reset() {
  await db.execute(sql`truncate businesses, admin_users restart identity cascade`);
}

describe.skipIf(!process.env.DATABASE_URL)('business ops', () => {
  beforeEach(async () => {
    await reset();
    const [a] = await db
      .insert(adminUsers)
      .values({ email: 'a@mk1.co', role: 'editor' })
      .returning();
    actor = { adminId: a.id, role: 'editor', email: a.email, name: null };
    const [b1] = await db
      .insert(businesses)
      .values({ name: 'Uno', slug: `uno-${crypto.randomUUID()}` })
      .returning();
    const [b2] = await db
      .insert(businesses)
      .values({ name: 'Dos', slug: `dos-${crypto.randomUUID()}` })
      .returning();
    businessId = b1.id;
    otherBusinessId = b2.id;
  });
  afterEach(reset);
  afterAll(async () => {
    const pool = (db as unknown as { $client?: { end?: () => Promise<void> } }).$client;
    await pool?.end?.();
  });

  it('replaces the weekly opening hours and keeps split shifts', async () => {
    await setOpeningHours(businessId, {
      entries: [
        { dayOfWeek: 1, opensAt: '08:00', closesAt: '12:00' },
        { dayOfWeek: 1, opensAt: '14:00', closesAt: '18:00' },
        { dayOfWeek: 6, opensAt: '20:00', closesAt: '02:00' },
      ],
    });
    let hours = await getOpeningHours(businessId);
    expect(hours).toHaveLength(3);

    await setOpeningHours(businessId, {
      entries: [{ dayOfWeek: 2, opensAt: '09:00', closesAt: '17:00' }],
    });
    hours = await getOpeningHours(businessId);
    expect(hours).toHaveLength(1);
    expect(hours[0].dayOfWeek).toBe(2);
  });

  it('records notes and contact history', async () => {
    const note = await addNote(businessId, actor, { body: 'Prefiere WhatsApp.' });
    expect(note.authorId).toBe(actor.adminId);
    const entry = await addContactEntry(businessId, actor, {
      method: 'whatsapp',
      outcome: 'Confirmó dirección.',
    });
    expect(entry.method).toBe('whatsapp');
  });

  it('keeps a single open follow-up per business and updates it in place', async () => {
    const first = await setFollowUp(businessId, actor, { dueOn: '2026-01-10', note: 'Llamar' });
    const second = await setFollowUp(businessId, actor, { dueOn: '2026-02-01' });
    expect(second.id).toBe(first.id);
    expect(second.dueOn).toBe('2026-02-01');
  });

  it('dashboard lists overdue follow-ups with the business name', async () => {
    await setFollowUp(businessId, actor, { dueOn: '2020-01-01' }); // overdue
    await setFollowUp(otherBusinessId, actor, { dueOn: '2999-01-01' }); // future

    const overdue = await listOpenFollowUps({ filter: 'overdue', limit: 100 });
    expect(overdue).toHaveLength(1);
    expect(overdue[0].businessName).toBe('Uno');
    expect(overdue[0].overdue).toBe(true);

    const open = await listOpenFollowUps({ filter: 'open', limit: 100 });
    expect(open).toHaveLength(2);
  });

  it('completing a follow-up frees the business for a new one', async () => {
    const fu = await setFollowUp(businessId, actor, { dueOn: '2026-01-10' });
    await completeFollowUp(fu.id, actor);
    const next = await setFollowUp(businessId, actor, { dueOn: '2026-03-01' });
    expect(next.id).not.toBe(fu.id);
    await expect(completeFollowUp(fu.id, actor)).rejects.toMatchObject({ status: 404 });
  });
});
