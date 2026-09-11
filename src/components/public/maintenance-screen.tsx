import { MAINTENANCE_MESSAGE } from '@/lib/maintenance';

export function MaintenanceScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16 text-center">
      <p className="font-display text-5xl font-extrabold uppercase tracking-wide">En mantenimiento</p>
      <p className="mt-6 text-lg text-muted">{MAINTENANCE_MESSAGE}</p>
    </main>
  );
}
