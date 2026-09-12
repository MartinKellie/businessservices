import { EnquiryBoard } from '@/components/admin/enquiry-board';

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EnquiryBoard selectedId={id} />;
}
