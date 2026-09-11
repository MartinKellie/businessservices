'use client';

import Link from 'next/link';
import { LocaleToggle } from '@/components/public/locale-toggle';
import { ThemeToggleSlot } from '@/components/public/theme-toggle-slot';
import { usePublicCopy } from '@/lib/use-public-copy';

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const { copy } = usePublicCopy();
  const nav = [
    { href: '/acerca', label: copy.about },
    { href: '/anunciate', label: copy.advertise },
    { href: '/contacto', label: copy.contact },
  ];

  return (
    <header className="flex items-center justify-between gap-4 border-b border-rail/25 px-4 py-3 sm:px-6">
      <Link href="/" className="font-display text-lg font-extrabold uppercase tracking-wide sm:text-xl md:text-2xl">
        {copy.siteName}
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3" aria-label={copy.navMain}>
        {compact
          ? null
          : nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hidden text-sm underline-offset-4 hover:underline md:inline"
              >
                {item.label}
              </Link>
            ))}
        <LocaleToggle />
        <ThemeToggleSlot />
      </nav>
    </header>
  );
}
