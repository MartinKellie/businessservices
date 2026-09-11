import Link from 'next/link';

/**
 * Temporary scaffold screen for routes not yet designed (About, Advertise,
 * Contact, legal). Public chrome comes from the public layout.
 */
export function PlaceholderScreen({ title, note }: { title: string; note?: string }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">{title}</h1>
      <p className="mt-4 text-muted">Esta página se diseñará en una siguiente tanda.</p>
      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
      <p className="mt-8">
        <Link href="/" className="underline-offset-4 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
