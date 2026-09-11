import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';
import { AdminSignInScreen } from '@/components/admin/admin-sign-in';

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if ((await auth())?.user) redirect('/admin');
  const { error } = await searchParams;

  async function googleSignIn() {
    'use server';
    await signIn('google', { redirectTo: '/admin' });
  }

  return <AdminSignInScreen error={Boolean(error)} action={googleSignIn} />;
}
