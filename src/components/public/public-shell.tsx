'use client';

import { usePathname } from 'next/navigation';
import { AnnouncementBanner } from '@/components/public/announcement-banner';
import { CookieConsentProvider, CookieDock } from '@/components/public/cookie-consent';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteHeader } from '@/components/public/site-header';

export function PublicShell({
  announcement,
  children,
}: {
  announcement: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSearch = pathname === '/buscar';

  return (
    <CookieConsentProvider>
      <div className="flex min-h-dvh flex-col bg-board">
        {announcement ? <AnnouncementBanner text={announcement} /> : null}
        <SiteHeader />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <CookieDock />
        {isSearch ? null : <SiteFooter />}
      </div>
    </CookieConsentProvider>
  );
}
