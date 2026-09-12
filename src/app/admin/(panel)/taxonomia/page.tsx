import { TaxonomyBoard } from '@/components/admin/taxonomy-board';
import { requireAdminPage } from '@/lib/auth-guards';

export default async function TaxonomyPage() {
  const admin = await requireAdminPage();
  return <TaxonomyBoard role={admin.role} />;
}
