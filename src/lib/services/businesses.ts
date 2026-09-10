import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import {
  businessCategories,
  businessProductsServices,
  businesses,
  categories,
  openingHours,
  premises,
  productsServices,
  businessStatus,
} from '@/db/schema';
import { HttpError } from '@/lib/http';
import type { AdminIdentity } from '@/lib/auth-guards';
import { uniqueSlug } from '@/lib/slug';
import { normaliseSearchText } from '@/lib/text';

export type BusinessStatus = (typeof businessStatus.enumValues)[number];

const contactChannels = {
  phone: z.string().trim().max(40).nullish(),
  whatsapp: z.string().trim().max(40).nullish(),
  email: z.string().trim().email().max(200).nullish(),
  website: z.string().trim().url().max(300).nullish(),
  instagram: z.string().trim().max(200).nullish(),
  facebook: z.string().trim().max(200).nullish(),
};

/** Contact fields whose change requires a strong verification method (scope §23). */
export const HIGH_RISK_FIELDS = ['phone', 'whatsapp', 'email', 'website'] as const;
const STRONG_VERIFICATION = ['phone_verified', 'visited', 'business_claimed'] as const;

export const createBusinessSchema = z.object({
  name: z.string().trim().min(2).max(200),
  ...contactChannels,
});

const verificationSchema = z.object({
  level: z.enum(['researched', 'contacted', 'phone_verified', 'visited', 'business_claimed']),
  method: z.enum([
    'public_information',
    'phone_call',
    'shop_visit',
    'local_contact',
    'business_confirmation',
    'other',
  ]),
  source: z.string().trim().max(300).optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  ...contactChannels,
  verification: verificationSchema.optional(),
});

export const listBusinessesQuerySchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(businessStatus.enumValues).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

async function slugTaken(slug: string) {
  const hit = await db.query.businesses.findFirst({
    where: eq(businesses.slug, slug),
    columns: { id: true },
  });
  return Boolean(hit);
}

export async function createBusiness(
  input: z.infer<typeof createBusinessSchema>,
  actor: AdminIdentity,
) {
  const slug = await uniqueSlug(input.name, slugTaken);
  const [row] = await db
    .insert(businesses)
    .values({
      name: input.name,
      slug,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      instagram: input.instagram ?? null,
      facebook: input.facebook ?? null,
      createdBy: actor.adminId,
      updatedBy: actor.adminId,
    })
    .returning();
  return row;
}

/** Full aggregate for the admin editor / validation. */
export async function getBusiness(id: string) {
  const business = await db.query.businesses.findFirst({ where: eq(businesses.id, id) });
  if (!business) throw new HttpError(404, 'not_found', 'Negocio no encontrado.');

  const [cats, prods, activePremises, hours] = await Promise.all([
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        isPrimary: businessCategories.isPrimary,
      })
      .from(businessCategories)
      .innerJoin(categories, eq(categories.id, businessCategories.categoryId))
      .where(eq(businessCategories.businessId, id)),
    db
      .select({ id: productsServices.id, name: productsServices.name, slug: productsServices.slug })
      .from(businessProductsServices)
      .innerJoin(
        productsServices,
        eq(productsServices.id, businessProductsServices.productServiceId),
      )
      .where(eq(businessProductsServices.businessId, id)),
    db
      .select({
        id: premises.id,
        kind: premises.kind,
        label: premises.label,
        addressLine: premises.addressLine,
        areaId: premises.areaId,
        serviceAreaNote: premises.serviceAreaNote,
        locationPrecision: premises.locationPrecision,
        lat: sql<number | null>`ST_Y(${premises.location}::geometry)`,
        lng: sql<number | null>`ST_X(${premises.location}::geometry)`,
      })
      .from(premises)
      .where(and(eq(premises.businessId, id), eq(premises.isActive, true)))
      .limit(1),
    db.select().from(openingHours).where(eq(openingHours.businessId, id)),
  ]);

  return {
    ...business,
    categories: cats,
    productsServices: prods,
    premises: activePremises[0] ?? null,
    openingHours: hours,
  };
}

export async function listBusinesses(query: z.infer<typeof listBusinessesQuerySchema>) {
  const where = and(
    query.status ? eq(businesses.status, query.status) : undefined,
    query.q
      ? or(
          ilike(businesses.nameNormalised, `%${normaliseSearchText(query.q)}%`),
          ilike(businesses.phone, `%${query.q}%`),
          ilike(businesses.whatsapp, `%${query.q}%`),
        )
      : undefined,
  );
  const rows = await db
    .select()
    .from(businesses)
    .where(where)
    .orderBy(desc(businesses.updatedAt))
    .limit(query.limit)
    .offset(query.offset);
  return rows;
}

export async function updateBusiness(
  id: string,
  input: z.infer<typeof updateBusinessSchema>,
  actor: AdminIdentity,
) {
  const current = await db.query.businesses.findFirst({ where: eq(businesses.id, id) });
  if (!current) throw new HttpError(404, 'not_found', 'Negocio no encontrado.');

  const changedHighRisk = HIGH_RISK_FIELDS.filter(
    (f) => input[f] !== undefined && (input[f] ?? null) !== (current[f] ?? null),
  );
  if (changedHighRisk.length > 0) {
    const strong =
      input.verification &&
      (STRONG_VERIFICATION as readonly string[]).includes(input.verification.level);
    if (!strong) {
      throw new HttpError(
        422,
        'verification_required',
        'Cambiar datos de contacto requiere una verificación fuerte (teléfono verificado, visita o confirmación del negocio).',
        Object.fromEntries(changedHighRisk.map((f) => [f, 'Requiere verificación.'])),
      );
    }
  }

  const [row] = await db
    .update(businesses)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...Object.fromEntries(
        (['phone', 'whatsapp', 'email', 'website', 'instagram', 'facebook'] as const)
          .filter((f) => input[f] !== undefined)
          .map((f) => [f, input[f] || null]),
      ),
      ...(input.verification
        ? {
            verificationLevel: input.verification.level,
            verificationMethod: input.verification.method,
            verificationSource: input.verification.source ?? current.verificationSource ?? null,
            lastVerifiedAt: sql`now()`,
          }
        : {}),
      updatedBy: actor.adminId,
      updatedAt: sql`now()`,
    })
    .where(eq(businesses.id, id))
    .returning();
  return row;
}

// --- Category / product links -----------------------------------------------

export const setCategoriesSchema = z.object({
  primaryCategoryId: z.string().uuid(),
  secondaryCategoryIds: z.array(z.string().uuid()).default([]),
});

export async function setBusinessCategories(
  businessId: string,
  input: z.infer<typeof setCategoriesSchema>,
) {
  const ids = [input.primaryCategoryId, ...input.secondaryCategoryIds];
  const found = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(inArray(categories.id, ids), eq(categories.status, 'approved')));
  if (found.length !== new Set(ids).size) {
    throw new HttpError(
      422,
      'invalid_categories',
      'Una o más categorías no existen o no están aprobadas.',
    );
  }

  await db.transaction(async (tx) => {
    await tx.delete(businessCategories).where(eq(businessCategories.businessId, businessId));
    await tx.insert(businessCategories).values(
      [...new Set(ids)].map((categoryId) => ({
        businessId,
        categoryId,
        isPrimary: categoryId === input.primaryCategoryId,
      })),
    );
  });
}

// --- Premises ---------------------------------------------------------------

export const setPremisesSchema = z
  .object({
    kind: z.enum(['physical', 'service_area']),
    label: z.string().trim().max(120).optional(),
    addressLine: z.string().trim().max(300).optional(),
    areaId: z.string().uuid().optional(),
    lat: z.number().gte(-90).lte(90).optional(),
    lng: z.number().gte(-180).lte(180).optional(),
    locationPrecision: z.enum(['exact', 'approximate', 'area_only']).optional(),
    serviceAreaNote: z.string().trim().max(300).optional(),
  })
  .refine((v) => (v.lat === undefined) === (v.lng === undefined), {
    message: 'Debe indicar latitud y longitud juntas.',
  })
  .refine((v) => v.kind !== 'service_area' || Boolean(v.serviceAreaNote || v.areaId), {
    message: 'Un negocio de servicio necesita una zona de cobertura o un área.',
  });

/** Creates or updates the single active premises for a business. */
export async function setActivePremises(
  businessId: string,
  input: z.infer<typeof setPremisesSchema>,
) {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { id: true },
  });
  if (!business) throw new HttpError(404, 'not_found', 'Negocio no encontrado.');

  const point =
    input.lat !== undefined && input.lng !== undefined
      ? sql`ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography`
      : null;

  const values = {
    kind: input.kind,
    label: input.label ?? null,
    addressLine: input.kind === 'physical' ? (input.addressLine ?? null) : null,
    areaId: input.areaId ?? null,
    location: point,
    locationPrecision: input.locationPrecision ?? null,
    serviceAreaNote: input.kind === 'service_area' ? (input.serviceAreaNote ?? null) : null,
    updatedAt: sql`now()`,
  };

  const existing = await db.query.premises.findFirst({
    where: and(eq(premises.businessId, businessId), eq(premises.isActive, true)),
    columns: { id: true },
  });

  if (existing) {
    const [row] = await db
      .update(premises)
      .set(values)
      .where(eq(premises.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(premises)
    .values({ businessId, isActive: true, ...values })
    .returning();
  return row;
}

export const setProductsSchema = z.object({
  productServiceIds: z.array(z.string().uuid()).default([]),
});

export async function setBusinessProductsServices(
  businessId: string,
  input: z.infer<typeof setProductsSchema>,
) {
  const ids = [...new Set(input.productServiceIds)];
  if (ids.length > 0) {
    const found = await db
      .select({ id: productsServices.id })
      .from(productsServices)
      .where(and(inArray(productsServices.id, ids), eq(productsServices.status, 'approved')));
    if (found.length !== ids.length) {
      throw new HttpError(
        422,
        'invalid_products',
        'Uno o más productos/servicios no existen o no están aprobados.',
      );
    }
  }
  await db.transaction(async (tx) => {
    await tx
      .delete(businessProductsServices)
      .where(eq(businessProductsServices.businessId, businessId));
    if (ids.length > 0) {
      await tx
        .insert(businessProductsServices)
        .values(ids.map((productServiceId) => ({ businessId, productServiceId })));
    }
  });
}
