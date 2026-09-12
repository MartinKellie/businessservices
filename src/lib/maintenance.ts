import { HttpError } from '@/lib/http';
import { getPublicSettings } from '@/lib/services/settings';

/**
 * Fixed Spanish maintenance message (scope §39 — not editable in the MVP).
 */
export const MAINTENANCE_MESSAGE =
  'El directorio está temporalmente en mantenimiento. Vuelve a intentarlo en unos minutos.';

/**
 * Throws `503` when Maintenance Mode is on. Call at the top of every public API
 * route. The public pages enforce the same check in `app/(public)/layout.tsx`.
 * `/admin`, `/api/admin/*` and `/api/auth/*` are never affected.
 */
export async function assertNotInMaintenance(): Promise<void> {
  const { maintenanceMode } = await getPublicSettings();
  if (maintenanceMode) {
    throw new HttpError(503, 'maintenance', MAINTENANCE_MESSAGE);
  }
}
