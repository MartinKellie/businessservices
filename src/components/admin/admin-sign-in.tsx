'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ADMIN_LOCALE_COOKIE, type Locale } from '@/i18n/config';

export function AdminSignInScreen({
  error,
  action,
  locale,
  copy,
}: {
  error: boolean;
  action: () => Promise<void>;
  locale: string;
  copy: {
    title: string;
    blurb: string;
    continueGoogle: string;
    error: string;
    localeAria: string;
    home: string;
  };
}) {
  const router = useRouter();

  function setLocale(next: Locale) {
    document.cookie = `${ADMIN_LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh flex-col bg-board text-ink">
      <div className="flex items-center justify-between gap-3 border-b border-rail/40 px-4 py-2">
        <Link href="/" className="text-sm underline-offset-4 hover:underline">
          {copy.home}
        </Link>
        <div className="flex border border-rail/40" role="group" aria-label={copy.localeAria}>
          <button
            type="button"
            aria-pressed={locale === 'es'}
            onClick={() => setLocale('es')}
            className={`px-2.5 py-2 text-sm ${locale === 'es' ? 'bg-ink text-board' : 'hover:bg-ink hover:text-board'}`}
          >
            ES
          </button>
          <button
            type="button"
            aria-pressed={locale === 'en'}
            onClick={() => setLocale('en')}
            className={`px-2.5 py-2 text-sm ${locale === 'en' ? 'bg-ink text-board' : 'hover:bg-ink hover:text-board'}`}
          >
            EN
          </button>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <p className="font-display text-sm font-extrabold tracking-wide uppercase text-muted">
          MK1GROUP
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-wide uppercase">
          {copy.title}
        </h1>
        <p className="mt-4 text-muted">{copy.blurb}</p>
        {error ? (
          <p className="mt-6 bg-warn px-4 py-3 text-sm text-warn-ink" role="alert">
            {copy.error}
          </p>
        ) : null}
        <form action={action} className="mt-10">
          <button
            type="submit"
            className="w-full bg-ink px-8 py-3 font-display text-lg font-extrabold tracking-wide uppercase text-board hover:bg-signal hover:text-signal-ink"
          >
            {copy.continueGoogle}
          </button>
        </form>
        <p className="mt-8">
          <Link href="/" className="text-sm underline-offset-4 hover:underline">
            {copy.home}
          </Link>
        </p>
      </div>
    </main>
  );
}
