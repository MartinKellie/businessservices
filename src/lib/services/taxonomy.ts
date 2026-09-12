import { and, asc, eq, ilike, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { db } from '@/db';
import {
  businessCategories,
  businessProductsServices,
  categories,
  productsServices,
  synonyms,
  type taxonomyStatus,
} from '@/db/schema';
import { HttpError } from '@/lib/http';
import { isUniqueViolation } from '@/lib/db-errors';
import { hasRole } from '@/lib/roles';
import type { AdminIdentity } from '@/lib/auth-guards';
import { uniqueSlug } from '@/lib/slug';
import { normaliseSearchText } from '@/lib/text';
import { approvalRequired } from '@/lib/services/settings';

type TaxonomyStatus = (typeof taxonomyStatus.enumValues)[number];

export const taxonomyListQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const reviewSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({ decision: z.literal('reject'), reason: z.string().trim().min(1).max(500) }),
]);

/** Status a newly created entry gets, given who created it and the settings. */
async function initialStatus(
  actor: AdminIdentity,
  kind: 'category' | 'product_service' | 'synonym',
): Promise<TaxonomyStatus> {
  if (hasRole(actor.role, 'owner')) return 'approved';
  const required = await approvalRequired();
  const key = kind === 'synonym' ? 'synonym' : kind;
  return required[key] ? 'pending' : 'approved';
}

// --- Categories & products/services (structurally identical) --------------------

const nameSchema = z.string().trim().min(2).max(120);

export const createCategorySchema = z.object({
  name: nameSchema,
  fallbackIcon: z.string().trim().max(60).optional(),
  isPopular: z.boolean().optional(),
});
export const updateCategorySchema = createCategorySchema.partial().extend({
  sortOrder: z.number().int().optional(),
});

export const createProductServiceSchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(500).optional(),
});
export const updateProductServiceSchema = createProductServiceSchema.partial();

function likeClause(column: PgColumn, q?: string) {
  return q ? ilike(column, `%${normaliseSearchText(q)}%`) : undefined;
}

export async function listCategories(query: z.infer<typeof taxonomyListQuerySchema>) {
  const where = and(
    query.status ? eq(categories.status, query.status) : undefined,
    likeClause(categories.nameNormalised, query.q),
  );
  return db
    .select()
    .from(categories)
    .where(where)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
    .limit(query.limit)
    .offset(query.offset);
}

export async function createCategory(
  input: z.infer<typeof createCategorySchema>,
  actor: AdminIdentity,
) {
  const status = await initialStatus(actor, 'category');
  const slug = await uniqueSlug(input.name, async (s) => {
    const hit = await db.query.categories.findFirst({
      where: eq(categories.slug, s),
      columns: { id: true },
    });
    return Boolean(hit);
  });
  const [row] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug,
      fallbackIcon: input.fallbackIcon ?? null,
      isPopular: input.isPopular ?? false,
      status,
      requestedBy: actor.adminId,
      requestedAt: sql`now()`,
      reviewedBy: status === 'approved' ? actor.adminId : null,
      reviewedAt: status === 'approved' ? sql`now()` : null,
    })
    .returning();
  return row;
}

export async function updateCategory(id: string, input: z.infer<typeof updateCategorySchema>) {
  const [row] = await db
    .update(categories)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.fallbackIcon !== undefined ? { fallbackIcon: input.fallbackIcon || null } : {}),
      ...(input.isPopular !== undefined ? { isPopular: input.isPopular } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(categories.id, id))
    .returning();
  if (!row) throw new HttpError(404, 'not_found', 'Categoría no encontrada.');
  return row;
}

export async function reviewCategory(
  id: string,
  decision: z.infer<typeof reviewSchema>,
  actor: AdminIdentity,
) {
  const [row] = await db
    .update(categories)
    .set({
      status: decision.decision === 'approve' ? 'approved' : 'rejected',
      rejectionReason: decision.decision === 'reject' ? decision.reason : null,
      reviewedBy: actor.adminId,
      reviewedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(categories.id, id))
    .returning();
  if (!row) throw new HttpError(404, 'not_found', 'Categoría no encontrada.');
  return row;
}

export async function deleteCategory(id: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(businessCategories)
    .where(eq(businessCategories.categoryId, id));
  if (count > 0) {
    throw new HttpError(409, 'in_use', `La categoría está asignada a ${count} negocio(s).`);
  }
  const deleted = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  if (deleted.length === 0) throw new HttpError(404, 'not_found', 'Categoría no encontrada.');
}

export async function listProductsServices(query: z.infer<typeof taxonomyListQuerySchema>) {
  const where = and(
    query.status ? eq(productsServices.status, query.status) : undefined,
    likeClause(productsServices.nameNormalised, query.q),
  );
  return db
    .select()
    .from(productsServices)
    .where(where)
    .orderBy(asc(productsServices.name))
    .limit(query.limit)
    .offset(query.offset);
}

export async function createProductService(
  input: z.infer<typeof createProductServiceSchema>,
  actor: AdminIdentity,
) {
  const status = await initialStatus(actor, 'product_service');
  const slug = await uniqueSlug(input.name, async (s) => {
    const hit = await db.query.productsServices.findFirst({
      where: eq(productsServices.slug, s),
      columns: { id: true },
    });
    return Boolean(hit);
  });
  const [row] = await db
    .insert(productsServices)
    .values({
      name: input.name,
      slug,
      description: input.description ?? null,
      status,
      requestedBy: actor.adminId,
      requestedAt: sql`now()`,
      reviewedBy: status === 'approved' ? actor.adminId : null,
      reviewedAt: status === 'approved' ? sql`now()` : null,
    })
    .returning();
  return row;
}

export async function updateProductService(
  id: string,
  input: z.infer<typeof updateProductServiceSchema>,
) {
  const [row] = await db
    .update(productsServices)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(productsServices.id, id))
    .returning();
  if (!row) throw new HttpError(404, 'not_found', 'Producto/servicio no encontrado.');
  return row;
}

export async function reviewProductService(
  id: string,
  decision: z.infer<typeof reviewSchema>,
  actor: AdminIdentity,
) {
  const [row] = await db
    .update(productsServices)
    .set({
      status: decision.decision === 'approve' ? 'approved' : 'rejected',
      rejectionReason: decision.decision === 'reject' ? decision.reason : null,
      reviewedBy: actor.adminId,
      reviewedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(productsServices.id, id))
    .returning();
  if (!row) throw new HttpError(404, 'not_found', 'Producto/servicio no encontrado.');
  return row;
}

export async function deleteProductService(id: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(businessProductsServices)
    .where(eq(businessProductsServices.productServiceId, id));
  if (count > 0) {
    throw new HttpError(409, 'in_use', `El producto/servicio está asignado a ${count} negocio(s).`);
  }
  const deleted = await db
    .delete(productsServices)
    .where(eq(productsServices.id, id))
    .returning({ id: productsServices.id });
  if (deleted.length === 0)
    throw new HttpError(404, 'not_found', 'Producto/servicio no encontrado.');
}

// --- Synonyms -----------------------------------------------------------------

export const createSynonymSchema = z
  .object({
    term: z.string().trim().min(2).max(120),
    scope: z.enum(['global', 'product_service', 'category']).default('global'),
    productServiceId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) =>
      (v.scope === 'global' && !v.productServiceId && !v.categoryId) ||
      (v.scope === 'product_service' && v.productServiceId && !v.categoryId) ||
      (v.scope === 'category' && v.categoryId && !v.productServiceId),
    { message: 'El alcance del sinónimo no coincide con el objetivo indicado.' },
  );

export async function listSynonyms(query: z.infer<typeof taxonomyListQuerySchema>) {
  const where = and(
    query.status ? eq(synonyms.status, query.status) : undefined,
    likeClause(synonyms.termNormalised, query.q),
  );
  return db
    .select()
    .from(synonyms)
    .where(where)
    .orderBy(asc(synonyms.term))
    .limit(query.limit)
    .offset(query.offset);
}

export async function createSynonym(
  input: z.infer<typeof createSynonymSchema>,
  actor: AdminIdentity,
) {
  const status = await initialStatus(actor, 'synonym');
  try {
    const [row] = await db
      .insert(synonyms)
      .values({
        term: input.term,
        scope: input.scope,
        productServiceId: input.productServiceId ?? null,
        categoryId: input.categoryId ?? null,
        notes: input.notes ?? null,
        status,
        requestedBy: actor.adminId,
        requestedAt: sql`now()`,
        reviewedBy: status === 'approved' ? actor.adminId : null,
        reviewedAt: status === 'approved' ? sql`now()` : null,
      })
      .returning();
    return row;
  } catch (err) {
    if (isUniqueViolation(err, 'synonyms_term_scope_target')) {
      throw new HttpError(409, 'already_exists', 'Ese sinónimo ya existe para ese objetivo.');
    }
    throw err;
  }
}

export async function reviewSynonym(
  id: string,
  decision: z.infer<typeof reviewSchema>,
  actor: AdminIdentity,
) {
  const [row] = await db
    .update(synonyms)
    .set({
      status: decision.decision === 'approve' ? 'approved' : 'rejected',
      rejectionReason: decision.decision === 'reject' ? decision.reason : null,
      reviewedBy: actor.adminId,
      reviewedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(synonyms.id, id))
    .returning();
  if (!row) throw new HttpError(404, 'not_found', 'Sinónimo no encontrado.');
  return row;
}

export async function deleteSynonym(id: string) {
  const deleted = await db
    .delete(synonyms)
    .where(eq(synonyms.id, id))
    .returning({ id: synonyms.id });
  if (deleted.length === 0) throw new HttpError(404, 'not_found', 'Sinónimo no encontrado.');
}
