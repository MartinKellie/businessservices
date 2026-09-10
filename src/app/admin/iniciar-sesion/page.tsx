import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';

/**
 * Minimal functional sign-in screen. Design is owned by Cursor
 * (see FRONTEND_HANDOFF.md §8) — this exists so the auth flow works end to end.
 */
export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if ((await auth())?.user) redirect('/admin');
  const { error } = await searchParams;

  return (
    <main style={{ padding: '2rem', maxWidth: '28rem', margin: '0 auto' }}>
      <h1>Acceso al panel</h1>
      <p>Solo para cuentas autorizadas de MK1GROUP.</p>
      {error ? (
        <p role="alert">No se pudo iniciar sesión, o la cuenta no tiene acceso al panel.</p>
      ) : null}
      <form
        action={async () => {
          'use server';
          await signIn('google', { redirectTo: '/admin' });
        }}
      >
        <button type="submit">Continuar con Google</button>
      </form>
    </main>
  );
}
