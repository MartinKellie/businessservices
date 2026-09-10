import { getPublicSettings } from '@/lib/services/settings';
import { MAINTENANCE_MESSAGE } from '@/lib/maintenance';

// The public shell reads live settings (Maintenance Mode, banner), so it is
// always rendered per-request rather than prerendered.
export const dynamic = 'force-dynamic';

/**
 * Public (Spanish-only) site layout. Header, footer, navigation, announcement
 * banner, cookie banner and theme toggle are implemented by Cursor.
 *
 * Maintenance Mode (scope §39) is enforced here rather than in the proxy: the
 * check needs the database, which is awkward from the edge runtime. `/admin`
 * lives outside this layout and stays reachable.
 */
export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { maintenanceMode } = await getPublicSettings();

  if (maintenanceMode) {
    return (
      <main
        style={{ padding: '3rem 1.5rem', maxWidth: '32rem', margin: '0 auto', textAlign: 'center' }}
      >
        <h1>En mantenimiento</h1>
        <p>{MAINTENANCE_MESSAGE}</p>
      </main>
    );
  }

  return <>{children}</>;
}
