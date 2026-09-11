import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { importBatchStatus, importFormat } from './enums';
import { businesses } from './businesses';
import { adminUsers } from './operations';

/**
 * A CSV/Excel import (scope §31). Rows are parsed and validated up front and
 * only turn into businesses (as drafts — never published directly) on commit,
 * so imports can never bypass the normal validation rules.
 */
export const importBatches = pgTable('import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  format: importFormat('format').notNull(),
  status: importBatchStatus('status').notNull().default('pending_review'),
  totalRows: integer('total_rows').notNull().default(0),
  validRows: integer('valid_rows').notNull().default(0),
  errorRows: integer('error_rows').notNull().default(0),
  committedRows: integer('committed_rows').notNull().default(0),
  createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  committedBy: uuid('committed_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  committedAt: timestamp('committed_at', { withTimezone: true }),
  ...timestamps,
});

/** One row of an import batch, with its validation result and raw source data. */
export const importRows = pgTable(
  'import_rows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => importBatches.id, { onDelete: 'cascade' }),
    rowNumber: integer('row_number').notNull(),
    // The raw cell values as read from the file, keyed by column name.
    raw: jsonb('raw').notNull().$type<Record<string, string>>(),
    ok: boolean('ok').notNull(),
    // Field -> Spanish message, for rows that failed validation.
    errors: jsonb('errors').$type<Record<string, string>>(),
    // Ids resolved during validation (category, area, products…), used on commit.
    resolved: jsonb('resolved').$type<Record<string, unknown>>(),
    businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'set null' }),
    committedAt: timestamp('committed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('import_rows_batch_idx').on(t.batchId, t.rowNumber)],
);
