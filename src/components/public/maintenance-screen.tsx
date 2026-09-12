'use client';

import { LocaleToggle } from '@/components/public/locale-toggle';
import { usePublicCopy } from '@/lib/use-public-copy';

export function MaintenanceScreen() {
  const { copy } = usePublicCopy();

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16 text-center">
      <div className="absolute top-4 right-4">
        <LocaleToggle />
      </div>
      <p className="font-display text-5xl font-extrabold uppercase tracking-wide">
        {copy.maintenanceTitle}
      </p>
      <p className="mt-6 text-lg text-muted">{copy.maintenanceMessage}</p>
    </main>
  );
}
