'use client';

import { useCookieConsent } from '@/components/public/cookie-consent';
import { BoardArticle, BoardSections } from '@/components/public/board-article';
import { usePublicCopy } from '@/lib/use-public-copy';

export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const { copy } = usePublicCopy();
  const { openPanel } = useCookieConsent();
  const title = kind === 'privacy' ? copy.privacyTitle : copy.termsTitle;
  const sections = kind === 'privacy' ? copy.privacySections : copy.termsSections;

  return (
    <BoardArticle title={title} lead={copy.legalPending}>
      <BoardSections sections={sections} />
      {kind === 'privacy' ? (
        <p className="mt-10">
          <button
            type="button"
            onClick={openPanel}
            className="border border-rail/40 px-5 py-2.5 text-sm hover:bg-ink hover:text-board"
          >
            {copy.cookieManage}
          </button>
        </p>
      ) : null}
    </BoardArticle>
  );
}
