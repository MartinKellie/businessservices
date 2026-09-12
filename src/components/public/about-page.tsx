'use client';

import {
  BoardArticle,
  BoardGhostLink,
  BoardPrimaryLink,
  BoardSections,
} from '@/components/public/board-article';
import { usePublicCopy } from '@/lib/use-public-copy';

export function AboutPage() {
  const { copy } = usePublicCopy();

  return (
    <BoardArticle title={copy.aboutTitle} lead={copy.aboutLead}>
      <BoardSections sections={copy.aboutSections} />
      <p className="mt-10 flex flex-wrap gap-3">
        <BoardPrimaryLink href="/">{copy.aboutSearch}</BoardPrimaryLink>
        <BoardGhostLink href="/anunciate">{copy.advertise}</BoardGhostLink>
      </p>
      <p className="mt-8 text-xs tracking-wide uppercase">{copy.poweredBy}</p>
    </BoardArticle>
  );
}
