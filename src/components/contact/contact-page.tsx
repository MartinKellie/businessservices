'use client';

import Link from 'next/link';
import { ContactForm } from '@/components/contact/contact-form';
import { usePublicCopy } from '@/lib/use-public-copy';

export function ContactPage({ initialType }: { initialType?: string }) {
  const { copy } = usePublicCopy();

  return (
    <main className="mx-auto w-full max-w-[42rem] px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-4xl font-extrabold uppercase tracking-wide sm:text-5xl">
        {copy.contactTitle}
      </h1>
      <p className="mt-8 max-w-prose text-base leading-relaxed">{copy.contactIntro}</p>
      <div className="mt-10">
        <ContactForm key={initialType ?? 'general'} initialType={initialType} />
      </div>
      <p className="mt-12">
        <Link href="/" className="underline-offset-4 hover:underline">
          {copy.backHome}
        </Link>
      </p>
    </main>
  );
}
