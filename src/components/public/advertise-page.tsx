'use client';

import {
  BoardArticle,
  BoardGhostLink,
  BoardPrimaryLink,
  BoardSections,
} from '@/components/public/board-article';
import { usePublicCopy } from '@/lib/use-public-copy';

export function AdvertisePage() {
  const { copy } = usePublicCopy();

  return (
    <BoardArticle title={copy.advertiseTitle} lead={copy.advertiseLead}>
      <BoardSections sections={copy.advertiseSections} />
      <p className="mt-10 flex flex-wrap gap-3">
        <BoardPrimaryLink href="/contacto?type=add_business">{copy.advertiseAdd}</BoardPrimaryLink>
        <BoardGhostLink href="/contacto?type=advertising">{copy.advertisePromo}</BoardGhostLink>
      </p>
    </BoardArticle>
  );
}
