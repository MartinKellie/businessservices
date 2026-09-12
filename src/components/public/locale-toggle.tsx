'use client';

import { DEV_UI_LOCALE, fill } from '@/lib/public-copy';
import { usePublicCopy } from '@/lib/use-public-copy';

export function LocaleToggle() {
  const { copy, locale, setLocale } = usePublicCopy();
  if (!DEV_UI_LOCALE) return null;

  return (
    <div
      className="flex border border-rail/40"
      role="group"
      aria-label={fill(copy.localeAria, { label: locale.toUpperCase() })}
    >
      <button
        type="button"
        aria-pressed={locale === 'es'}
        onClick={() => setLocale('es')}
        className={`h-9 px-2.5 text-sm ${locale === 'es' ? 'bg-ink text-board' : 'hover:bg-ink hover:text-board'}`}
      >
        ES
      </button>
      <button
        type="button"
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
        className={`h-9 px-2.5 text-sm ${locale === 'en' ? 'bg-ink text-board' : 'hover:bg-ink hover:text-board'}`}
      >
        EN
      </button>
    </div>
  );
}
