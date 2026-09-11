'use client';

import Link from 'next/link';
import { usePublicCopy } from '@/lib/use-public-copy';

export function BoardArticle({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  const { copy } = usePublicCopy();

  return (
    <main className="mx-auto w-full max-w-[42rem] px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide sm:text-5xl">{title}</h1>
      {lead ? <p className="mt-8 max-w-prose text-base leading-relaxed">{lead}</p> : null}
      <div className={lead ? 'mt-2' : 'mt-8'}>{children}</div>
      <p className="mt-12">
        <Link href="/" className="underline-offset-4 hover:underline">
          {copy.backHome}
        </Link>
      </p>
    </main>
  );
}

export function BoardSections({ sections }: { sections: { title: string; body: string }[] }) {
  return (
    <div>
      {sections.map((section) => (
        <section key={section.title} className="mt-10 border-t border-rail/20 pt-8">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-wide sm:text-3xl">
            {section.title}
          </h2>
          <p className="mt-3 max-w-prose leading-relaxed">{section.body}</p>
        </section>
      ))}
    </div>
  );
}

export function BoardPrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="bg-ink px-5 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-board hover:bg-signal hover:text-signal-ink"
    >
      {children}
    </Link>
  );
}

export function BoardGhostLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="border border-rail/40 px-5 py-2.5 text-sm hover:bg-ink hover:text-board">
      {children}
    </Link>
  );
}
