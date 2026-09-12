import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps, tsvector } from './_shared';
import { synonymScope, taxonomyStatus } from './enums';
import { businesses } from './businesses';
import { adminUsers } from './operations';

/** Columns shared by every controlled-taxonomy table (request → approve flow). */
const reviewColumns = {
  status: taxonomyStatus('status').notNull().default('approved'),
  requestedBy: uuid('requested_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  requestedAt: timestamp('requested_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
};

/**
 * Business categories (scope §8). Structured and reusable; a business can belong
 * to several (see `businessCategories`). Names are stored once in Spanish.
 */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    nameNormalised: text('name_normalised').generatedAlwaysAs(sql`search_normalise(name)`),
    // Fallback shown on cards / pins when a business has no media (scope §16, §17).
    fallbackIcon: text('fallback_icon'),
    fallbackImageUrl: text('fallback_image_url'),
    isPopular: boolean('is_popular').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('spanish', f_unaccent(coalesce(name, '')))`,
    ),
    ...reviewColumns,
    ...timestamps,
  },
  (t) => [
    index('categories_name_trgm_idx').using('gin', sql`${t.nameNormalised} gin_trgm_ops`),
    index('categories_search_vector_idx').using('gin', t.searchVector),
    index('categories_status_idx').on(t.status),
  ],
);

/**
 * Products / services as shared concepts (scope §7). Reusable across businesses;
 * free text never auto-creates one.
 */
export const productsServices = pgTable(
  'products_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    nameNormalised: text('name_normalised').generatedAlwaysAs(sql`search_normalise(name)`),
    // Optional internal note describing the concept's boundary.
    description: text('description'),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('spanish', f_unaccent(coalesce(name, '')))`,
    ),
    ...reviewColumns,
    ...timestamps,
  },
  (t) => [
    index('products_services_name_trgm_idx').using('gin', sql`${t.nameNormalised} gin_trgm_ops`),
    index('products_services_search_vector_idx').using('gin', t.searchVector),
    index('products_services_status_idx').on(t.status),
  ],
);

/**
 * Synonyms / aliases and local terminology (scope §9). Global by default; may be
 * scoped to a single product/service concept or category. Managed centrally,
 * never per-business. Search expands query terms through this table at query
 * time (application-level, not a Postgres thesaurus dictionary).
 */
export const synonyms = pgTable(
  'synonyms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    term: text('term').notNull(),
    termNormalised: text('term_normalised').generatedAlwaysAs(sql`search_normalise(term)`),
    scope: synonymScope('scope').notNull().default('global'),
    productServiceId: uuid('product_service_id').references(() => productsServices.id, {
      onDelete: 'cascade',
    }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
    notes: text('notes'),
    ...reviewColumns,
    ...timestamps,
  },
  (t) => [
    index('synonyms_term_trgm_idx').using('gin', sql`${t.termNormalised} gin_trgm_ops`),
    check(
      'synonyms_scope_target',
      sql`(
        (${t.scope} = 'global' and ${t.productServiceId} is null and ${t.categoryId} is null)
        or (${t.scope} = 'product_service' and ${t.productServiceId} is not null and ${t.categoryId} is null)
        or (${t.scope} = 'category' and ${t.categoryId} is not null and ${t.productServiceId} is null)
      )`,
    ),
    // No duplicate term for the same scope + target (NULLs compared as equal).
    unique('synonyms_term_scope_target')
      .on(t.termNormalised, t.scope, t.productServiceId, t.categoryId)
      .nullsNotDistinct(),
  ],
);

/**
 * Business ↔ category link (scope §8). Exactly one row per business may be the
 * primary category.
 */
export const businessCategories = pgTable(
  'business_categories',
  {
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.businessId, t.categoryId] }),
    index('business_categories_category_idx').on(t.categoryId),
    uniqueIndex('business_categories_one_primary')
      .on(t.businessId)
      .where(sql`${t.isPrimary}`),
  ],
);

/** Business ↔ product/service link (scope §7). */
export const businessProductsServices = pgTable(
  'business_products_services',
  {
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    productServiceId: uuid('product_service_id')
      .notNull()
      .references(() => productsServices.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.businessId, t.productServiceId] }),
    index('business_products_services_ps_idx').on(t.productServiceId),
  ],
);
