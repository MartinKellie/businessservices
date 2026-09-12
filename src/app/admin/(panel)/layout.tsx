import { signOut } from '@/auth';
import { AdminShell } from '@/components/admin/admin-shell';
import { requireAdminPage } from '@/lib/auth-guards';

export default async function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdminPage();

  async function signOutAction() {
    'use server';
    await signOut({ redirectTo: '/admin/iniciar-sesion' });
  }

  return (
    <AdminShell
      email={admin.email}
      name={admin.name}
      role={admin.role}
      signOutAction={signOutAction}
    >
      {children}
    </AdminShell>
  );
}
