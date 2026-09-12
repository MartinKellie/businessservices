import { BusinessDesk } from '@/components/admin/business-desk';

export default function NegociosLayout({ children }: { children: React.ReactNode }) {
  return <BusinessDesk>{children}</BusinessDesk>;
}
