import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { adminRole, contactMethod } from './enums';
import { businesses } from './businesses';

/**
 * Admin users. This table IS the access allow-list: Google sign-in only
 * succeeds for an email present here with `isActive = true` (scope §26, §27).
 */
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Stored lower-cased; matched case-insensitively against the Google profile.
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  role: adminRole('role').notNull().default('editor'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
});

/** Free-form internal notes on a business. Never public (scope §29). */
export const internalNotes = pgTable(
  'internal_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    ...timestamps,
  },
  (t) => [index('internal_notes_business_idx').on(t.businessId)],
);

/** Lightweight contact-history entries (scope §29). Not a CRM. */
export const contactHistory = pgTable(
  'contact_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    contactedOn: date('contacted_on').notNull().defaultNow(),
    method: contactMethod('method').notNull(),
    outcome: text('outcome'),
    ...timestamps,
  },
  (t) => [index('contact_history_business_idx').on(t.businessId)],
);

/**
 * Follow-up reminders (scope §30). One open follow-up per business at a time;
 * completed ones are retained for history. The dashboard queries open rows by
 * `dueOn` for the due / overdue views.
 */
export const followUps = pgTable(
  'follow_ups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    dueOn: date('due_on').notNull(),
    note: text('note'),
    createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    completedBy: uuid('completed_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    index('follow_ups_due_idx')
      .on(t.dueOn)
      .where(sql`${t.completedAt} is null`),
    uniqueIndex('follow_ups_one_open_per_business')
      .on(t.businessId)
      .where(sql`${t.completedAt} is null`),
  ],
);
