import { MaintenanceScreen } from '@/components/public/maintenance-screen';
import { PublicShell } from '@/components/public/public-shell';
import { getPublicSettings } from '@/lib/services/settings';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSettings();

  if (settings.maintenanceMode) {
    return <MaintenanceScreen />;
  }

  return (
    <PublicShell announcement={settings.announcement.enabled ? settings.announcement.text : null}>
      {children}
    </PublicShell>
  );
}
