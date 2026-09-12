import { and, asc, desc, eq, isNull, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { businesses, contactHistory, followUps, internalNotes } from '@/db/schema';
import { HttpError } from '@/lib/http';
import { isUniqueViolation } from '@/lib/db-errors';
import type { AdminIdentity } from '@/lib/auth-guards';

async function assertBusinessExists(businessId: string) {
  const hit = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { id: true },
  });
  if (!hit) throw new HttpError(404, 'not_found', 'Negocio no encontrado.');
}

// --- Internal notes (scope §29) --------------------------------------------

export const addNoteSchema = z.object({ body: z.string().trim().min(1).max(4000) });

export async function listNotes(businessId: string) {
  return db
    .select()
    .from(internalNotes)
    .where(eq(internalNotes.businessId, businessId))
    .orderBy(desc(internalNotes.createdAt));
}

export async function addNote(
  businessId: string,
  actor: AdminIdentity,
  input: z.infer<typeof addNoteSchema>,
) {
  await assertBusinessExists(businessId);
  const [row] = await db
    .insert(internalNotes)
    .values({ businessId, authorId: actor.adminId, body: input.body })
    .returning();
  return row;
}

// --- Contact history (scope §29) ------------------------------------------

export const addContactEntrySchema = z.object({
  contactedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  method: z.enum(['phone', 'whatsapp', 'email', 'visit', 'other']),
  outcome: z.string().trim().max(2000).optional(),
});

export async function listContactHistory(businessId: string) {
  return db
    .select()
    .from(contactHistory)
    .where(eq(contactHistory.businessId, businessId))
    .orderBy(desc(contactHistory.contactedOn), desc(contactHistory.createdAt));
}

export async function addContactEntry(
  businessId: string,
  actor: AdminIdentity,
  input: z.infer<typeof addContactEntrySchema>,
) {
  await assertBusinessExists(businessId);
  const [row] = await db
    .insert(contactHistory)
    .values({
      businessId,
      authorId: actor.adminId,
      method: input.method,
      outcome: input.outcome ?? null,
      ...(input.contactedOn ? { contactedOn: input.contactedOn } : {}),
    })
    .returning();
  return row;
}

// --- Follow-ups (scope §30) ----------------------------------------------

export const setFollowUpSchema = z.object({
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD).'),
  note: z.string().trim().max(2000).optional(),
});

/** The open follow-up for a business, if any. */
export async function getOpenFollowUp(businessId: string) {
  return db.query.followUps.findFirst({
    where: and(eq(followUps.businessId, businessId), isNull(followUps.completedAt)),
  });
}

/** Creates the open follow-up, or updates it if one already exists. */
export async function setFollowUp(
  businessId: string,
  actor: AdminIdentity,
  input: z.infer<typeof setFollowUpSchema>,
) {
  await assertBusinessExists(businessId);
  const open = await getOpenFollowUp(businessId);
  if (open) {
    const [row] = await db
      .update(followUps)
      .set({ dueOn: input.dueOn, note: input.note ?? null, updatedAt: sql`now()` })
      .where(eq(followUps.id, open.id))
      .returning();
    return row;
  }
  try {
    const [row] = await db
      .insert(followUps)
      .values({
        businessId,
        dueOn: input.dueOn,
        note: input.note ?? null,
        createdBy: actor.adminId,
      })
      .returning();
    return row;
  } catch (err) {
    if (isUniqueViolation(err, 'follow_ups_one_open_per_business')) {
      throw new HttpError(409, 'follow_up_exists', 'El negocio ya tiene un seguimiento abierto.');
    }
    throw err;
  }
}

export async function completeFollowUp(id: string, actor: AdminIdentity) {
  const [row] = await db
    .update(followUps)
    .set({ completedAt: sql`now()`, completedBy: actor.adminId, updatedAt: sql`now()` })
    .where(and(eq(followUps.id, id), isNull(followUps.completedAt)))
    .returning();
  if (!row) throw new HttpError(404, 'not_found', 'Seguimiento no encontrado o ya completado.');
  return row;
}

export async function clearFollowUp(businessId: string) {
  await db
    .delete(followUps)
    .where(and(eq(followUps.businessId, businessId), isNull(followUps.completedAt)));
}

export const followUpDashboardQuerySchema = z.object({
  filter: z.enum(['due', 'overdue', 'open']).default('open'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

/** Dashboard list of open follow-ups (scope §30): due today, overdue, or all open. */
export async function listOpenFollowUps(query: z.infer<typeof followUpDashboardQuerySchema>) {
  const today = sql`current_date`;
  const dueFilter =
    query.filter === 'overdue'
      ? sql`${followUps.dueOn} < ${today}`
      : query.filter === 'due'
        ? lte(followUps.dueOn, sql`${today}`)
        : undefined;

  return db
    .select({
      id: followUps.id,
      businessId: followUps.businessId,
      businessName: businesses.name,
      dueOn: followUps.dueOn,
      note: followUps.note,
      overdue: sql<boolean>`${followUps.dueOn} < ${today}`,
    })
    .from(followUps)
    .innerJoin(businesses, eq(businesses.id, followUps.businessId))
    .where(and(isNull(followUps.completedAt), dueFilter))
    .orderBy(asc(followUps.dueOn))
    .limit(query.limit);
}
