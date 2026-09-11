'use client';

import { MessageCircle, Phone } from 'lucide-react';
import { CategoryGlyph } from '@/components/category-glyph';
import type { SearchCard } from '@/lib/api-contract';
import { formatDistance, statusLabel, telHref, whatsappHref } from '@/lib/public-format';

interface ResultCardProps {
  card: SearchCard;
  selected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}

export function ResultCard({ card, selected, onSelect, children }: ResultCardProps) {
  const status = statusLabel(card.status);
  const media = card.logoUrl || card.photoUrl;

  return (
    <article
      id={`result-${card.id}`}
      className={`border-b border-rail/20 ${selected ? 'bg-ink text-board' : 'bg-transparent'}`}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 px-4 py-4 text-left">
        <span
          className={`flex size-14 shrink-0 items-center justify-center overflow-hidden border ${
            selected ? 'border-board/40' : 'border-rail/30'
          }`}
        >
          {media ? (
            // User-uploaded remote URLs; next/image host list is not known at build time.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media} alt="" className="size-full object-cover" />
          ) : (
            <CategoryGlyph name={card.primaryCategory?.icon} size={22} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display block text-xl font-extrabold uppercase leading-tight tracking-wide">
            {card.name}
          </span>
          <span className={`mt-1 block text-sm ${selected ? 'text-board/80' : 'text-muted'}`}>
            {[card.primaryCategory?.name, card.areaName].filter(Boolean).join(' · ')}
            {card.distanceMeters != null ? ` · ${formatDistance(card.distanceMeters)}` : ''}
          </span>
          {card.serviceAreaNote ? (
            <span className="mt-1 block text-sm">Zona de servicio: {card.serviceAreaNote}</span>
          ) : null}
          <span className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            {card.openStatus === 'open' ? (
              <span className={selected ? 'text-board' : 'text-signal'}>Abierto</span>
            ) : null}
            {card.openStatus === 'closed' ? <span>Cerrado</span> : null}
            {status ? (
              <span className={selected ? 'bg-board px-1.5 text-ink' : 'bg-warn px-1.5 text-warn-ink'}>
                {status}
              </span>
            ) : null}
          </span>
        </span>
      </button>
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {card.contact.whatsapp ? (
          <a
            href={whatsappHref(card.contact.whatsapp)}
            className="inline-flex items-center gap-1.5 bg-signal px-3 py-1.5 text-sm font-semibold text-signal-ink"
            onClick={(event) => event.stopPropagation()}
          >
            <MessageCircle size={16} strokeWidth={2} aria-hidden="true" />
            WhatsApp
          </a>
        ) : null}
        {card.contact.phone ? (
          <a
            href={telHref(card.contact.phone)}
            className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm ${
              selected ? 'border-board/50' : 'border-rail/40'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <Phone size={16} strokeWidth={2} aria-hidden="true" />
            Llamar
          </a>
        ) : null}
      </div>
      {children}
    </article>
  );
}
