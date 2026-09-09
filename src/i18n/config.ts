/**
 * Locale configuration.
 *
 * The public directory is Spanish only. The admin dashboard is bilingual and the
 * chosen locale is stored in the `ADMIN_LOCALE` cookie. We deliberately avoid
 * `[locale]` path routing: the public site never needs it and the admin area is
 * behind auth, so a cookie is sufficient.
 */
export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

export const ADMIN_LOCALE_COOKIE = 'ADMIN_LOCALE';

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'es' || value === 'en';
}
