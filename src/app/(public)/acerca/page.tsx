import type { Metadata } from 'next';
import { AboutPage } from '@/components/public/about-page';

export const metadata: Metadata = {
  title: 'Acerca de · Directorio de Cúcuta',
};

export default function AboutRoute() {
  return <AboutPage />;
}
