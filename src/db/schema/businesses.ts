import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { geographyPoint, timestamps, tsvector } from './_shared';
import {
  businessStatus,
  locationPrecision,
  premisesKind,
  verificationLevel,
  verificationMethod,
} from './enums';
import { areas } from './areas';
import { adminUsers } from './operations';

/**
 * A business. Identity, public contact channels, status and internal
 * verification data live here; the physical location lives in `premises` so that
 * relocation and premises takeover need no schema change (scope §20).
 */
export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    // Admin-facing stable identifier (name slug + short id suffix).
    slug: text('slug').notNull().unique(),
    nameNormalised: text('name_normalised').generatedAlwaysAs(sql`search_normalise(name)`),

    status: businessStatus('status').notNull().default('draft'),
    // Set when status = 'relocated': the active business that replaced this one.
    relocatedToBusinessId: uuid('relocated_to_business_id').references(
      (): AnyPgColumn => businesses.id,
      { onDelete: 'set null' },
    ),

    // Public contact channels (scope §16). All optional; publish rules enforced
    // in the service layer.
    phone: text('phone'),
    whatsapp: text('whatsapp'),
    email: text('email'),
    website: text('website'),
    instagram: text('instagram'),
    facebook: text('facebook'),

    // Internal verification (scope §23, §24). Never exposed publicly.
    verificationLevel: verificationLevel('verification_level'),
    verificationMethod: verificationMethod('verification_method'),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    verificationSource: text('verification_source'),

    // Spanish full-text vector over the business name.
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('spanish', f_unaccent(coalesce(name, '')))`,
    ),

    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    // Soft delete (scope §19). status is set to 'archived' at the same time.
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('businesses_status_idx').on(t.status),
    index('businesses_name_trgm_idx').using('gin', sql`${t.nameNormalised} gin_trgm_ops`),
    index('businesses_search_vector_idx').using('gin', t.searchVector),
    index('businesses_relocated_to_idx').on(t.relocatedToBusinessId),
  ],
);

/**
 * A premises / location for a business. MVP shows one active premises per
 * business; history is retained via `isActive` + validity dates (scope §20).
 */
export const premises = pgTable(
  'premises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    kind: premisesKind('kind').notNull().default('physical'),
    label: text('label'),

    // Physical premises: street address + map pin.
    addressLine: text('address_line'),
    areaId: uuid('area_id').references(() => areas.id, { onDelete: 'set null' }),
    location: geographyPoint('location'),
    locationPrecision: locationPrecision('location_precision'),

    // Mobile/service premises: a described service area instead of an address
    // (scope §10, §16 — never a private residential address).
    serviceAreaNote: text('service_area_note'),

    isActive: boolean('is_active').notNull().default(true),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
    validTo: timestamp('valid_to', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('premises_business_idx').on(t.businessId),
    index('premises_area_idx').on(t.areaId),
    index('premises_location_idx').using('gist', t.location),
    // At most one active premises per business.
    uniqueIndex('premises_one_active_per_business')
      .on(t.businessId)
      .where(sql`${t.isActive}`),
  ],
);

/**
 * Opening hours (scope §18). Optional; never blocks publication. A null
 * `premisesId` means business-wide hours; a value is a location-specific
 * override (supported by the model, not surfaced in the MVP UI). Multiple rows
 * for the same day represent split shifts; `closesAt < opensAt` means the shift
 * runs past midnight.
 */
export const openingHours = pgTable(
  'opening_hours',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    premisesId: uuid('premises_id').references(() => premises.id, { onDelete: 'cascade' }),
    // ISO day of week: 1 = Monday … 7 = Sunday (matches Postgres EXTRACT(ISODOW)).
    dayOfWeek: smallint('day_of_week').notNull(),
    opensAt: time('opens_at').notNull(),
    closesAt: time('closes_at').notNull(),
    ...timestamps,
  },
  (t) => [
    index('opening_hours_business_day_idx').on(t.businessId, t.dayOfWeek),
    check('opening_hours_day_of_week_range', sql`${t.dayOfWeek} between 1 and 7`),
  ],
);
