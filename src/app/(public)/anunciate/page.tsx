import type { Metadata } from 'next';
import { AdvertisePage } from '@/components/public/advertise-page';

export const metadata: Metadata = {
  title: 'Anúnciate · Directorio de Cúcuta',
};

export default function AdvertiseRoute() {
  return <AdvertisePage />;
}
