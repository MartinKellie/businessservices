import Link from 'next/link';

/**
 * Temporary scaffold screen. Every public and admin screen is handed to Cursor
 * for design and implementation (see FRONTEND_HANDOFF.md). These placeholders
 * only exist so routing, layouts, middleware and API wiring can be built and
 * tested in parallel.
 */
export function PlaceholderScreen({ title, note }: { title: string; note?: string }) {
  return (
    <main style={{ padding: '2rem', maxWidth: '40rem', margin: '0 auto' }}>
      <h1>{title}</h1>
      <p>Pantalla pendiente de implementación por Cursor.</p>
      {note ? <p>{note}</p> : null}
      <p>
        <Link href="/">Inicio</Link>
      </p>
    </main>
  );
}
