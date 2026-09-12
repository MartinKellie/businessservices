import { ImportBoard } from '@/components/admin/import-board';

export default async function ImportBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ImportBoard batchId={id} />;
}
