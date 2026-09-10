import { and, asc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { businesses, openingHours } from '@/db/schema';
import { HttpError } from '@/lib/http';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (formato HH:MM).');

export const setOpeningHoursSchema = z.object({
  // Full replacement of the business-wide weekly schedule. Multiple entries for
  // one day = split shifts; closesAt <= opensAt = the shift runs past midnight.
  entries: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(1).max(7),
        opensAt: timeSchema,
        closesAt: timeSchema,
      }),
    )
    .max(50),
});

export async function getOpeningHours(businessId: string) {
  return db
    .select()
    .from(openingHours)
    .where(and(eq(openingHours.businessId, businessId), isNull(openingHours.premisesId)))
    .orderBy(asc(openingHours.dayOfWeek), asc(openingHours.opensAt));
}

export async function setOpeningHours(
  businessId: string,
  input: z.infer<typeof setOpeningHoursSchema>,
) {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { id: true },
  });
  if (!business) throw new HttpError(404, 'not_found', 'Negocio no encontrado.');

  await db.transaction(async (tx) => {
    await tx
      .delete(openingHours)
      .where(and(eq(openingHours.businessId, businessId), isNull(openingHours.premisesId)));
    if (input.entries.length > 0) {
      await tx.insert(openingHours).values(
        input.entries.map((e) => ({
          businessId,
          dayOfWeek: e.dayOfWeek,
          opensAt: e.opensAt,
          closesAt: e.closesAt,
        })),
      );
    }
  });
  return getOpeningHours(businessId);
}
