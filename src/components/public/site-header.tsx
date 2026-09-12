'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LocaleToggle } from '@/components/public/locale-toggle';
import { ThemeToggleSlot } from '@/components/public/theme-toggle-slot';
import { usePublicCopy } from '@/lib/use-public-copy';

export function SiteHeader() {
  const { copy } = usePublicCopy();
  const pathname = usePathname();
  const nav = [
    { href: '/acerca', label: copy.about },
    { href: '/anunciate', label: copy.advertise },
    { href: '/contacto', label: copy.contact },
  ];

  return (
    <header className="flex items-center justify-between gap-4 border-b border-rail/25 px-4 py-3 sm:px-6">
      <Link
        href="/"
        className="font-display text-lg font-extrabold uppercase tracking-wide sm:text-xl md:text-2xl"
      >
        {copy.siteName}
      </Link>
      <nav
        className="flex flex-wrap items-center justify-end gap-2 sm:gap-3"
        aria-label={copy.navMain}
      >
        {nav.map((item) => {
          const current = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              className={
                current
                  ? 'bg-ink px-2 py-1 text-sm text-board'
                  : 'px-2 py-1 text-sm underline-offset-4 hover:underline'
              }
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/admin/iniciar-sesion"
          className="px-2 py-1 text-sm text-muted underline-offset-4 hover:underline"
        >
          {copy.adminEntry}
        </Link>
        <LocaleToggle />
        <ThemeToggleSlot />
      </nav>
    </header>
  );
}
