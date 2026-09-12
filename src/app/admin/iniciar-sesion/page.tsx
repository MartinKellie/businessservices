import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { auth, signIn } from '@/auth';
import { AdminSignInScreen } from '@/components/admin/admin-sign-in';

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if ((await auth())?.user) redirect('/admin');
  const { error } = await searchParams;
  const [t, locale] = await Promise.all([getTranslations('admin.signIn'), getLocale()]);

  async function googleSignIn() {
    'use server';
    await signIn('google', { redirectTo: '/admin' });
  }

  return (
    <AdminSignInScreen
      error={Boolean(error)}
      action={googleSignIn}
      locale={locale}
      copy={{
        title: t('title'),
        blurb: t('blurb'),
        continueGoogle: t('continueGoogle'),
        error: t('error'),
        localeAria: t('localeAria'),
        home: t('home'),
      }}
    />
  );
}
