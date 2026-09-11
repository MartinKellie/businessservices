'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ADMIN_LOCALE_COOKIE, type Locale } from '@/i18n/config';

export function AdminSignInScreen({
  error,
  action,
}: {
  error: boolean;
  action: () => Promise<void>;
}) {
  const t = useTranslations('admin.signIn');
  const locale = useLocale();
  const router = useRouter();

  function setLocale(next: Locale) {
    document.cookie = `${ADMIN_LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <div className="absolute top-4 right-4 flex gap-1 text-sm">
        <button
          type="button"
          aria-pressed={locale === 'es'}
          onClick={() => setLocale('es')}
          className={`border px-2 py-1 ${locale === 'es' ? 'border-ink bg-ink text-board' : 'border-rail/40 hover:bg-ink hover:text-board'}`}
        >
          ES
        </button>
        <button
          type="button"
          aria-pressed={locale === 'en'}
          onClick={() => setLocale('en')}
          className={`border px-2 py-1 ${locale === 'en' ? 'border-ink bg-ink text-board' : 'border-rail/40 hover:bg-ink hover:text-board'}`}
        >
          EN
        </button>
      </div>
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide sm:text-5xl">{t('title')}</h1>
      <p className="mt-4 text-muted">{t('blurb')}</p>
      {error ? (
        <p className="mt-6 bg-warn px-4 py-3 text-sm text-warn-ink" role="alert">
          {t('error')}
        </p>
      ) : null}
      <form action={action} className="mt-10">
        <button
          type="submit"
          className="w-full bg-ink px-8 py-3 font-display text-lg font-extrabold uppercase tracking-wide text-board hover:bg-signal hover:text-signal-ink"
        >
          {t('continueGoogle')}
        </button>
      </form>
    </main>
  );
}
