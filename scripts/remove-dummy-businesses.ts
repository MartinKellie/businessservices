import 'dotenv/config';
import { and, desc, eq, inArray, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { businesses, importBatches, importRows } from '@/db/schema';

/**
 * Undoes `npm run seed:dummy` — deletes every business created by its import
 * batch (cascades premises/notes/etc.), then the batch itself. Safe to run
 * even after real businesses have been added since it only touches rows
 * linked to that specific batch.
 *
 *   npm run seed:dummy:remove                      (latest dummy-data batch)
 *   npm run seed:dummy:remove -- <import-batch-id>  (a specific batch)
 */
async function main() {
  const batchId = process.argv[2];

  const batch = batchId
    ? await db.query.importBatches.findFirst({ where: eq(importBatches.id, batchId) })
    : await db.query.importBatches.findFirst({
        where: eq(importBatches.filename, 'dummy-cucuta-businesses.csv'),
        orderBy: desc(importBatches.createdAt),
      });

  if (!batch) {
    console.log('No matching import batch found — nothing to remove.');
    return;
  }

  const rows = await db
    .select({ businessId: importRows.businessId })
    .from(importRows)
    .where(and(eq(importRows.batchId, batch.id), isNotNull(importRows.businessId)));
  const ids = rows.map((r) => r.businessId).filter((id): id is string => Boolean(id));

  if (ids.length > 0) {
    await db.delete(businesses).where(inArray(businesses.id, ids));
  }
  await db.delete(importBatches).where(eq(importBatches.id, batch.id));

  console.log(`Removed ${ids.length} businesses and import batch ${batch.id} (${batch.filename}).`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
