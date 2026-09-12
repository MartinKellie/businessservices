'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ADMIN_LOCALE_COOKIE, type Locale } from '@/i18n/config';
import { PREF, type ThemePreference } from '@/lib/preferences';
import { hasRole, type AdminRole } from '@/lib/roles';
import { usePreference } from '@/lib/use-preference';

const DRAWERS: { href: string; key: string; owner?: boolean }[] = [
  { href: '/admin/negocios', key: 'businesses' },
  { href: '/admin/consultas', key: 'enquiries' },
  { href: '/admin/seguimientos', key: 'followUps' },
  { href: '/admin/taxonomia', key: 'taxonomy' },
  { href: '/admin/importar', key: 'imports', owner: true },
  { href: '/admin/vista-previa', key: 'preview' },
  { href: '/admin/configuracion', key: 'settings', owner: true },
  { href: '/admin/usuarios', key: 'users', owner: true },
];

function applyTheme(theme: ThemePreference) {
  const dark =
    theme === 'dark' ||
    (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function AdminShell({
  children,
  email,
  name,
  role,
  signOutAction,
}: {
  children: React.ReactNode;
  email: string;
  name: string | null;
  role: AdminRole;
  signOutAction: () => Promise<void>;
}) {
  const t = useTranslations('admin');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isOwner = hasRole(role, 'owner');

  return (
    <div className="flex min-h-dvh flex-col bg-board text-ink">
      <header className="flex items-center gap-3 border-b border-rail/40 px-3 py-2 sm:px-4">
        <button
          type="button"
          className="border border-rail/40 px-3 py-2 text-sm lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? t('shell.closeMenu') : t('shell.menu')}
        </button>
        <Link
          href="/"
          className="shrink-0 px-2 py-2 text-sm underline-offset-4 hover:underline"
        >
          {t('shell.home')}
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm">
          <span className="font-semibold">{name || email}</span>
          <span className="text-muted">
            {' '}
            · {role === 'owner' ? t('shell.roleOwner') : t('shell.roleEditor')}
          </span>
        </p>
        <LocalePair />
        <ThemeCycle />
        <form action={signOutAction}>
          <button
            type="submit"
            className="border border-rail/40 px-3 py-2 text-sm hover:bg-ink hover:text-board"
          >
            {t('shell.signOut')}
          </button>
        </form>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          className={`${open ? 'flex' : 'hidden'} w-full shrink-0 flex-col border-b border-rail/40 lg:flex lg:w-52 lg:border-r lg:border-b-0`}
          aria-label={t('shell.menu')}
        >
          {DRAWERS.filter((d) => !d.owner || isOwner).map((d) => {
            const active = pathname === d.href || pathname.startsWith(`${d.href}/`);
            return (
              <Link
                key={d.href}
                href={d.href}
                onClick={() => setOpen(false)}
                className={`border-b border-rail/20 px-4 py-3 font-display text-lg font-extrabold tracking-wide uppercase ${
                  active ? 'bg-ink text-board' : 'hover:bg-ink hover:text-board'
                }`}
              >
                {t(`nav.${d.key}`)}
              </Link>
            );
          })}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function LocalePair() {
  const t = useTranslations('admin.shell');
  const locale = useLocale();
  const router = useRouter();

  function setLocale(next: Locale) {
    document.cookie = `${ADMIN_LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="flex border border-rail/40" role="group" aria-label={t('localeAria')}>
      <button
        type="button"
        aria-pressed={locale === 'es'}
        onClick={() => setLocale('es')}
        className={`px-2.5 py-2 text-sm leading-none ${locale === 'es' ? 'bg-ink text-board' : 'hover:bg-ink hover:text-board'}`}
        suppressHydrationWarning
      >
        ES
      </button>
      <button
        type="button"
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
        className={`px-2.5 py-2 text-sm leading-none ${locale === 'en' ? 'bg-ink text-board' : 'hover:bg-ink hover:text-board'}`}
        suppressHydrationWarning
      >
        EN
      </button>
    </div>
  );
}

function ThemeCycle() {
  const t = useTranslations('admin.shell');
  const [stored, setStored] = usePreference(PREF.theme);
  const theme: ThemePreference =
    stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  const label =
    theme === 'dark' ? t('themeDark') : theme === 'light' ? t('themeLight') : t('themeSystem');
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={() => {
        const next: ThemePreference =
          theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
        setStored(next);
        applyTheme(next);
      }}
      className="inline-flex items-center gap-2 border border-rail/40 px-2.5 py-2 text-sm hover:bg-ink hover:text-board"
      aria-label={t('themeAria', { label })}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
