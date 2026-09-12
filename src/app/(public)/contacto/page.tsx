import type { Metadata } from 'next';
import { ContactPage } from '@/components/contact/contact-page';

export const metadata: Metadata = {
  title: 'Contacto · Directorio de Cúcuta',
};

export default async function ContactRoute({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return <ContactPage initialType={type} />;
}
