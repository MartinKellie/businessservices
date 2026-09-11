'use client';

import dynamic from 'next/dynamic';

export const ThemeToggleSlot = dynamic(
  () => import('@/components/public/theme-toggle').then((mod) => mod.ThemeToggle),
  { ssr: false, loading: () => <span className="inline-block h-8 w-16 border border-rail/40" /> },
);
