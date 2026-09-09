import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Directorio de Negocios — Cúcuta',
  description: 'Directorio local de negocios y servicios de Cúcuta y alrededores.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
