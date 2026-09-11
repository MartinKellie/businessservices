'use client';

import Link from 'next/link';
import { usePublicCopy } from '@/lib/use-public-copy';
import type { PublicCopy } from '@/lib/public-copy';

type PlaceholderTitle = Extract<
  keyof PublicCopy,
  'aboutTitle' | 'advertiseTitle' | 'contactTitle' | 'privacyTitle' | 'termsTitle'
>;
type PlaceholderNote = Extract<
  keyof PublicCopy,
  'aboutNote' | 'advertiseNote' | 'contactNote' | 'privacyNote' | 'termsNote'
>;

/**
 * Temporary scaffold screen for routes not yet designed (About, Advertise,
 * Contact, legal). Public chrome comes from the public layout.
 */
export function PlaceholderScreen({
  title,
  note,
  titleKey,
  noteKey,
}: {
  title?: string;
  note?: string;
  titleKey?: PlaceholderTitle;
  noteKey?: PlaceholderNote;
}) {
  const { copy } = usePublicCopy();
  const heading = titleKey ? copy[titleKey] : title;
  const extra = noteKey ? copy[noteKey] : note;

  return (
    <main className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide">{heading}</h1>
      <p className="mt-4 text-muted">{copy.placeholderSoon}</p>
      {extra ? <p className="mt-3 text-sm text-muted">{extra}</p> : null}
      <p className="mt-8">
        <Link href="/" className="underline-offset-4 hover:underline">
          {copy.backHome}
        </Link>
      </p>
    </main>
  );
}
