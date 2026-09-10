import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { enquiryStatus, enquiryType, mediaReviewStatus } from './enums';
import { businesses } from './businesses';
import { adminUsers } from './operations';
import { businessMedia } from './media';

/**
 * Public contact-form submissions (scope §33, §34, §37). One shared queue, no
 * per-admin assignment. Retention lifecycle: at `purgeAfter` the row is
 * soft-deleted (`softDeletedAt`), then hard-deleted after the grace period.
 */
export const enquiries = pgTable(
  'enquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: enquiryType('type').notNull(),
    status: enquiryStatus('status').notNull().default('new'),

    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    message: text('message').notNull(),
    // Free-text business this enquiry is about, and an optional resolved link.
    businessReference: text('business_reference'),
    businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'set null' }),

    // Privacy Policy consent (scope §43): required, stored with the enquiry.
    consentGiven: boolean('consent_given').notNull(),
    consentPolicyVersion: text('consent_policy_version').notNull(),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),

    // Spam / abuse signals. IP is stored hashed, not raw.
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),

    // Internal handling.
    adminNotes: text('admin_notes'),
    handledBy: uuid('handled_by').references(() => adminUsers.id, { onDelete: 'set null' }),

    // Retention lifecycle timestamps.
    purgeAfter: timestamp('purge_after', { withTimezone: true }),
    softDeletedAt: timestamp('soft_deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('enquiries_status_idx').on(t.status),
    index('enquiries_type_idx').on(t.type),
    index('enquiries_created_at_idx').on(t.createdAt),
    index('enquiries_lifecycle_idx').on(t.softDeletedAt, t.purgeAfter),
  ],
);

/**
 * Images attached to a business-related enquiry (scope §35). Not auto-published;
 * require admin review. If approved and attached to a business, the created
 * `business_media` row is linked back via `promotedMediaId`.
 */
export const enquiryUploads = pgTable(
  'enquiry_uploads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enquiryId: uuid('enquiry_id')
      .notNull()
      .references(() => enquiries.id, { onDelete: 'cascade' }),
    blobUrl: text('blob_url').notNull(),
    blobPathname: text('blob_pathname').notNull(),
    contentType: text('content_type'),
    byteSize: integer('byte_size'),
    reviewStatus: mediaReviewStatus('review_status').notNull().default('pending'),
    promotedMediaId: uuid('promoted_media_id').references(() => businessMedia.id, {
      onDelete: 'set null',
    }),
    ...timestamps,
  },
  (t) => [index('enquiry_uploads_enquiry_idx').on(t.enquiryId)],
);
