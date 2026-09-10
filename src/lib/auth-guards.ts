import type { Session } from 'next-auth';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { SIGN_IN_PATH } from '@/auth.config';
import { HttpError } from '@/lib/http';
import { hasRole, type AdminRole } from '@/lib/roles';

export type AdminIdentity = {
  adminId: string;
  role: AdminRole;
  email: string;
  name: string | null;
};

function identityFrom(session: Session | null): AdminIdentity | null {
  if (!session?.user?.adminId || !session.user.role) return null;
  return {
    adminId: session.user.adminId,
    role: session.user.role,
    email: session.user.email ?? '',
    name: session.user.name ?? null,
  };
}

/**
 * For server components / pages: returns the current admin or redirects to
 * sign-in. Use in `/admin` route segments.
 */
export async function requireAdminPage(): Promise<AdminIdentity> {
  const identity = identityFrom(await auth());
  if (!identity) redirect(SIGN_IN_PATH);
  return identity;
}

/**
 * For API route handlers: returns the current admin or throws `HttpError`
 * (401 / 403). Pass a `role` to require at least that capability.
 */
export async function requireAdmin(role?: AdminRole): Promise<AdminIdentity> {
  const identity = identityFrom(await auth());
  if (!identity) {
    throw new HttpError(401, 'unauthenticated', 'Debe iniciar sesión.');
  }
  if (role && !hasRole(identity.role, role)) {
    throw new HttpError(403, 'forbidden', 'No tiene permisos para esta acción.');
  }
  return identity;
}
