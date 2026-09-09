import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

/**
 * Admin dashboard layout (bilingual ES/EN). Auth gating is enforced by
 * `src/proxy.ts` and per-route server guards (Phase 2). Full dashboard
 * chrome and screens are implemented by Cursor — see FRONTEND_HANDOFF.md.
 */
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
