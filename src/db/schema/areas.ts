import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { geographyPoint, timestamps } from './_shared';

/**
 * A community / area within the launch geography (Cúcuta, Los Patios,
 * Villa del Rosario, …). The location model is multi-area from the start
 * (scope §3, §10).
 */
export const areas = pgTable(
  'areas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    // Accent-insensitive, lower-cased name for search matching.
    nameNormalised: text('name_normalised').generatedAlwaysAs(sql`search_normalise(name)`),
    // Optional centroid, used as the map focus when this area is selected.
    centroid: geographyPoint('centroid'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index('areas_name_trgm_idx').using('gin', sql`${t.nameNormalised} gin_trgm_ops`),
    index('areas_centroid_idx').using('gist', t.centroid),
  ],
);
