import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { mediaReviewStatus, mediaSource, mediaType } from './enums';
import { businesses } from './businesses';
import { adminUsers } from './operations';

/**
 * Business logo / photos (scope §16, §17). Logo and photos are separate fields.
 * Business-submitted images are reviewed by an admin before publication — only
 * `reviewStatus = 'approved'` rows are ever returned to the public site.
 */
export const businessMedia = pgTable(
  'business_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    type: mediaType('type').notNull(),
    source: mediaSource('source').notNull().default('admin'),

    // Vercel Blob: public URL + pathname (pathname needed to delete the blob).
    blobUrl: text('blob_url').notNull(),
    blobPathname: text('blob_pathname').notNull(),
    contentType: text('content_type'),
    byteSize: integer('byte_size'),
    width: integer('width'),
    height: integer('height'),
    altText: text('alt_text'),

    reviewStatus: mediaReviewStatus('review_status').notNull().default('pending'),
    sortOrder: integer('sort_order').notNull().default(0),

    uploadedBy: uuid('uploaded_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    reviewedBy: uuid('reviewed_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('business_media_business_idx').on(t.businessId),
    // Fast lookup of the publishable media for a business.
    index('business_media_publishable_idx')
      .on(t.businessId, t.type, t.sortOrder)
      .where(sql`${t.reviewStatus} = 'approved'`),
  ],
);
