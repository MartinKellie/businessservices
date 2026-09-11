'use client';

import Link from 'next/link';
import { CategoryGlyph } from '@/components/category-glyph';
import type { PublicArea, PublicCategory } from '@/lib/api-contract';
import { PREF } from '@/lib/preferences';
import { usePreference } from '@/lib/use-preference';
import { usePublicCopy } from '@/lib/use-public-copy';

export function PopularCategories({
  categories,
  areas,
}: {
  categories: PublicCategory[];
  areas: PublicArea[];
}) {
  const [storedSlug] = usePreference(PREF.area);
  const { copy } = usePublicCopy();
  const areaId = areas.find((item) => item.slug === storedSlug)?.id;

  if (categories.length === 0) {
    return (
      <>
        <h2 id="popular-heading" className="font-display text-3xl font-extrabold uppercase tracking-wide">
          {copy.usual}
        </h2>
        <p className="mt-6 max-w-prose text-muted">{copy.emptyCategories}</p>
      </>
    );
  }

  return (
    <>
      <h2 id="popular-heading" className="font-display text-3xl font-extrabold uppercase tracking-wide">
        {copy.usual}
      </h2>
      <ul className="mt-4">
        {categories.map((category) => {
          const params = new URLSearchParams({ categoryId: category.id });
          if (areaId) params.set('areaId', areaId);
          return (
            <li key={category.id}>
              <Link
                href={`/buscar?${params.toString()}`}
                className="group flex items-baseline gap-3 border-b border-rail/20 py-3 hover:bg-ink hover:text-board"
              >
                <CategoryGlyph name={category.icon} className="translate-y-0.5 shrink-0" />
                <span className="font-display text-xl font-bold uppercase tracking-wide sm:text-2xl">
                  {category.name}
                </span>
                <span className="menu-leader min-w-8 flex-1 self-center" aria-hidden="true" />
                <span className="tabular-nums text-sm">
                  {category.businessCount}{' '}
                  {category.businessCount === 1 ? copy.businessOne : copy.businessMany}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
