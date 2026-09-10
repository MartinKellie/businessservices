import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { systemSettings } from '@/db/schema';

export type SystemSettings = typeof systemSettings.$inferSelect;

const SINGLETON_ID = 'global';

/**
 * Reads the singleton settings row, creating it with defaults if missing.
 * Not cached: the row is tiny and settings changes must take effect immediately
 * (Maintenance Mode, banner, approval toggles).
 */
export async function getSettings(): Promise<SystemSettings> {
  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.id, SINGLETON_ID),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(systemSettings)
    .values({ id: SINGLETON_ID })
    .onConflictDoNothing()
    .returning();
  return (
    created ??
    (await db.query.systemSettings.findFirst({ where: eq(systemSettings.id, SINGLETON_ID) }))!
  );
}

export async function updateSettings(
  patch: Partial<Omit<SystemSettings, 'id' | 'updatedAt' | 'updatedBy'>>,
  updatedBy: string,
): Promise<SystemSettings> {
  await getSettings(); // ensure the row exists
  const [row] = await db
    .update(systemSettings)
    .set({ ...patch, updatedBy, updatedAt: sql`now()` })
    .where(eq(systemSettings.id, SINGLETON_ID))
    .returning();
  return row;
}

export type PublicSettings = {
  maintenanceMode: boolean;
  announcement: { enabled: boolean; text: string };
  nearMeRadiusMeters: number;
  showLastUpdated: boolean;
};

/** The settings subset safe to expose to the public site. */
export async function getPublicSettings(): Promise<PublicSettings> {
  const s = await getSettings();
  return {
    maintenanceMode: s.maintenanceMode,
    announcement: { enabled: s.announcementEnabled, text: s.announcementText },
    nearMeRadiusMeters: s.nearMeRadiusMeters,
    showLastUpdated: s.publicLastUpdatedVisible,
  };
}

/** Which taxonomy types currently require owner approval for new entries. */
export async function approvalRequired() {
  const s = await getSettings();
  return {
    category: s.approvalRequiredCategories,
    product_service: s.approvalRequiredProducts,
    synonym: s.approvalRequiredSynonyms,
  };
}
