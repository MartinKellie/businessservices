'use client';

import Link from 'next/link';
import { usePublicCopy } from '@/lib/use-public-copy';

export function SiteFooter() {
  const { copy } = usePublicCopy();

  return (
    <footer className="border-t border-rail/25 px-4 py-5 text-sm text-muted sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <Link href="/acerca" className="underline-offset-4 hover:underline">
            {copy.about}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/anunciate" className="underline-offset-4 hover:underline">
            {copy.advertise}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/contacto" className="underline-offset-4 hover:underline">
            {copy.contact}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/privacidad" className="underline-offset-4 hover:underline">
            {copy.privacy}
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/terminos" className="underline-offset-4 hover:underline">
            {copy.terms}
          </Link>
        </p>
        <p className="text-xs tracking-wide uppercase">Powered by MK1GROUP</p>
      </div>
    </footer>
  );
}
