import type { Metadata } from 'next';
import { LegalPage } from '@/components/public/legal-page';

export const metadata: Metadata = {
  title: 'Privacidad · Directorio de Cúcuta',
};

export default function PrivacyRoute() {
  return <LegalPage kind="privacy" />;
}
