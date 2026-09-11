import Link from 'next/link';
import { ThemeToggleSlot } from '@/components/public/theme-toggle-slot';

const NAV = [
  { href: '/acerca', label: 'Acerca' },
  { href: '/anunciate', label: 'Anúnciate' },
  { href: '/contacto', label: 'Contacto' },
];

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-rail/25 px-4 py-3 sm:px-6">
      <Link href="/" className="font-display text-xl font-extrabold uppercase tracking-wide sm:text-2xl">
        Directorio de Cúcuta
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3" aria-label="Principal">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm underline-offset-4 hover:underline ${compact ? 'hidden md:inline' : ''}`}
          >
            {item.label}
          </Link>
        ))}
        <ThemeToggleSlot />
      </nav>
    </header>
  );
}
