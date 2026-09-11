import type { Metadata } from 'next';
import { Atkinson_Hyperlegible, Big_Shoulders } from 'next/font/google';
import { ThemeScript } from '@/components/theme-script';
import './globals.css';

const board = Big_Shoulders({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-board',
  display: 'swap',
  adjustFontFallback: false,
});

const body = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Directorio de Cúcuta',
  description: 'Directorio local de negocios y servicios de Cúcuta y alrededores.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${board.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-board font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
