import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { businessCategories, businessProductsServices, businesses, premises } from '@/db/schema';
import { HttpError } from '@/lib/http';
import type { AdminIdentity } from '@/lib/auth-guards';
import type { BusinessStatus } from '@/lib/services/businesses';

/**
 * Allowed status transitions (scope §19). Archiving (soft delete) is reachable
 * from anywhere; a draft can be restored from the archive.
 */
const TRANSITIONS: Record<BusinessStatus, BusinessStatus[]> = {
  draft: ['active', 'archived'],
  active: ['temporarily_closed', 'permanently_closed', 'relocated', 'archived'],
  temporarily_closed: ['active', 'permanently_closed', 'relocated', 'archived'],
  permanently_closed: ['active', 'archived'],
  relocated: ['active', 'archived'],
  archived: ['draft'],
};

/** Destructive / structural transitions restricted to owners (scope §26). */
const OWNER_ONLY: BusinessStatus[] = ['permanently_closed', 'archived'];

export const changeStatusSchema = z.object({
  status: z.enum(businesses.status.enumValues),
  /** Required when moving to `relocated`: the business that replaces this one. */
  relocatedToBusinessId: z.string().uuid().optional(),
});

type PublishProblem = { field: string; message: string };

/** Checks the publish-minimum requirements (scope §28). */
export async function publishReadiness(businessId: string): Promise<PublishProblem[]> {
  const problems: PublishProblem[] = [];

  const business = await db.query.businesses.findFirst({ where: eq(businesses.id, businessId) });
  if (!business) throw new HttpError(404, 'not_found', 'Negocio no encontrado.');

  if (!business.name?.trim()) problems.push({ field: 'name', message: 'Falta el nombre.' });

  const hasPublicContact = Boolean(
    business.phone || business.whatsapp || business.email || business.website,
  );
  if (!hasPublicContact) {
    problems.push({ field: 'contact', message: 'Falta un medio de contacto público.' });
  }

  const [{ count: primaryCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(businessCategories)
    .where(
      and(eq(businessCategories.businessId, businessId), eq(businessCategories.isPrimary, true)),
    );
  if (primaryCount === 0) {
    problems.push({ field: 'category', message: 'Falta la categoría principal.' });
  }

  const [{ count: productCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(businessProductsServices)
    .where(eq(businessProductsServices.businessId, businessId));
  if (productCount === 0) {
    problems.push({
      field: 'productsServices',
      message: 'Falta al menos un producto o servicio para búsqueda.',
    });
  }

  const activePremises = await db.query.premises.findFirst({
    where: and(eq(premises.businessId, businessId), eq(premises.isActive, true)),
  });
  if (!activePremises) {
    problems.push({ field: 'premises', message: 'Falta la ubicación o zona de servicio.' });
  } else if (!activePremises.areaId) {
    problems.push({ field: 'area', message: 'Falta el área/comunidad.' });
  } else if (
    activePremises.kind === 'physical' &&
    !activePremises.addressLine &&
    !activePremises.location
  ) {
    problems.push({ field: 'address', message: 'Falta la dirección o el punto en el mapa.' });
  } else if (activePremises.kind === 'service_area' && !activePremises.serviceAreaNote) {
    problems.push({ field: 'serviceArea', message: 'Falta la zona de cobertura.' });
  }

  return problems;
}

export async function changeStatus(
  businessId: string,
  input: z.infer<typeof changeStatusSchema>,
  actor: AdminIdentity,
) {
  const business = await db.query.businesses.findFirst({ where: eq(businesses.id, businessId) });
  if (!business) throw new HttpError(404, 'not_found', 'Negocio no encontrado.');

  const from = business.status as BusinessStatus;
  const to = input.status;
  if (from === to) return business;

  if (!TRANSITIONS[from]?.includes(to)) {
    throw new HttpError(409, 'invalid_transition', `No se puede pasar de "${from}" a "${to}".`);
  }
  if (OWNER_ONLY.includes(to) && actor.role !== 'owner') {
    throw new HttpError(403, 'forbidden', 'Solo un propietario puede realizar este cambio.');
  }

  if (to === 'active') {
    const problems = await publishReadiness(businessId);
    if (problems.length > 0) {
      throw new HttpError(
        422,
        'not_publishable',
        'El negocio no cumple los requisitos mínimos para publicarse.',
        Object.fromEntries(problems.map((p) => [p.field, p.message])),
      );
    }
  }

  if (to === 'relocated' && !input.relocatedToBusinessId) {
    throw new HttpError(
      422,
      'relocation_target_required',
      'Indique el negocio que reemplaza a este.',
    );
  }

  const [row] = await db
    .update(businesses)
    .set({
      status: to,
      relocatedToBusinessId: to === 'relocated' ? input.relocatedToBusinessId! : null,
      deletedAt: to === 'archived' ? sql`now()` : null,
      updatedBy: actor.adminId,
      updatedAt: sql`now()`,
    })
    .where(eq(businesses.id, businessId))
    .returning();
  return row;
}
