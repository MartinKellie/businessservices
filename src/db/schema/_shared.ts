import { customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamp } from 'drizzle-orm/pg-core';

/**
 * A PostGIS `geography(Point, 4326)` column. Values are read/written with raw SQL
 * helpers (`ST_MakePoint`, `ST_AsGeoJSON`, `ST_DWithin`, …) in the service layer,
 * so the TS representation is an opaque string (WKT/EWKB/GeoJSON as returned).
 */
export const geographyPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geography(Point, 4326)';
  },
});

/** A Postgres `tsvector` column (used for generated Spanish full-text columns). */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tsvector';
  },
});

/** `created_at` / `updated_at` pair shared by most tables. */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
};
