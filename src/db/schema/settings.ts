import { sql } from 'drizzle-orm';
import { boolean, check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { adminUsers } from './operations';

/**
 * Singleton system settings (scope §38). Exactly one row, keyed `global`.
 * Read on nearly every request, so it is a single typed row rather than a
 * key/value store.
 */
export const systemSettings = pgTable(
  'system_settings',
  {
    id: text('id').primaryKey().default('global'),

    // Taxonomy approval requirements (scope §7–9). Can be switched off per type.
    approvalRequiredCategories: boolean('approval_required_categories').notNull().default(true),
    approvalRequiredProducts: boolean('approval_required_products').notNull().default(true),
    approvalRequiredSynonyms: boolean('approval_required_synonyms').notNull().default(true),

    // Public "Última actualización" visibility (scope §24).
    publicLastUpdatedVisible: boolean('public_last_updated_visible').notNull().default(false),

    // Fixed "Cerca de mí" radius in metres (scope §10). Not user-adjustable.
    nearMeRadiusMeters: integer('near_me_radius_meters').notNull().default(5000),

    // Maintenance Mode (scope §39).
    maintenanceMode: boolean('maintenance_mode').notNull().default(false),

    // Homepage announcement banner (scope §40).
    announcementEnabled: boolean('announcement_enabled').notNull().default(false),
    announcementText: text('announcement_text').notNull().default(''),

    // Enquiry retention (scope §37).
    enquiryRetentionMonths: integer('enquiry_retention_months').notNull().default(12),
    enquiryDeletionGraceDays: integer('enquiry_deletion_grace_days').notNull().default(30),

    // Current Privacy Policy version, recorded against enquiry consent (scope §43).
    privacyPolicyVersion: text('privacy_policy_version').notNull().default('1'),

    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('system_settings_singleton', sql`${t.id} = 'global'`)],
);
