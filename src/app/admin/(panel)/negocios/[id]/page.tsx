import { BusinessFicha } from '@/components/admin/business-ficha';
import { requireAdminPage } from '@/lib/auth-guards';
import { listActiveAreas } from '@/lib/services/public';

export default async function BusinessFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, areas, admin] = await Promise.all([params, listActiveAreas(), requireAdminPage()]);
  return <BusinessFicha key={id} id={id} areas={areas} role={admin.role} />;
}
