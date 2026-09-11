import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-rail/25 px-4 py-5 text-sm text-muted sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <Link href="/acerca" className="underline-offset-4 hover:underline">
            Acerca
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/anunciate" className="underline-offset-4 hover:underline">
            Anúnciate
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/contacto" className="underline-offset-4 hover:underline">
            Contacto
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/privacidad" className="underline-offset-4 hover:underline">
            Privacidad
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/terminos" className="underline-offset-4 hover:underline">
            Términos
          </Link>
        </p>
        <p className="text-xs tracking-wide uppercase">Powered by MK1GROUP</p>
      </div>
    </footer>
  );
}
