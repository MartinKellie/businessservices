import { SearchPreviewBoard } from '@/components/admin/search-preview-board';
import { listActiveAreas } from '@/lib/services/public';

export default async function PreviewPage() {
  const areas = await listActiveAreas();
  return <SearchPreviewBoard areas={areas} />;
}
