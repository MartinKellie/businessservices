import { AnnouncementBanner } from '@/components/public/announcement-banner';
import { MaintenanceScreen } from '@/components/public/maintenance-screen';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';
import { getPublicSettings } from '@/lib/services/settings';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getPublicSettings();

  if (settings.maintenanceMode) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-board">
      {settings.announcement.enabled ? (
        <AnnouncementBanner text={settings.announcement.text} />
      ) : null}
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
