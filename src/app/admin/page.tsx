import { requireAdminPage } from '@/lib/auth-guards';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default async function AdminDashboardPage() {
  const admin = await requireAdminPage();
  return (
    <PlaceholderScreen
      title="Admin — Panel"
      note={`Sesión: ${admin.email} (${admin.role}). Dashboard bilingüe implementado por Cursor.`}
    />
  );
}
