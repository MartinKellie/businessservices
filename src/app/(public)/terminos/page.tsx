import type { Metadata } from 'next';
import { LegalPage } from '@/components/public/legal-page';

export const metadata: Metadata = {
  title: 'Términos · Directorio de Cúcuta',
};

export default function TermsRoute() {
  return <LegalPage kind="terms" />;
}
