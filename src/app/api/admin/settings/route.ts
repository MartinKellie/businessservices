import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { getSettings, updateSettings, updateSettingsSchema } from '@/lib/services/settings';

/** System Settings panel (scope §38). Owner only. */
export const GET = handle(async () => {
  await requireAdmin('owner');
  return NextResponse.json({ settings: await getSettings() });
});

export const PATCH = handle(async (request: NextRequest) => {
  const actor = await requireAdmin('owner');
  const patch = updateSettingsSchema.parse(await request.json());
  return NextResponse.json({ settings: await updateSettings(patch, actor.adminId) });
});
