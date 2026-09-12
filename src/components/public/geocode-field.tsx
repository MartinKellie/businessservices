'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchGeocode, PublicApiError, type GeocodeHit } from '@/lib/api-contract';
import { usePublicCopy } from '@/lib/use-public-copy';

type GeocodeNotice = 'short' | 'empty' | 'rate' | 'maintenance' | 'unavailable';

/**
 * Address/area lookup beside “Cerca de mí”. Resolves on submit — no live autocomplete.
 */
export function GeocodeField({
  onPick,
  compact = false,
}: {
  onPick: (hit: GeocodeHit) => void;
  compact?: boolean;
}) {
  const { copy } = usePublicCopy();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<GeocodeNotice | null>(null);
  const [picks, setPicks] = useState<GeocodeHit[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (picks.length === 0) return;
    function onOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setPicks([]);
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setPicks([]);
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [picks.length]);

  const noticeCopy: Record<GeocodeNotice, string> = {
    short: copy.addressShort,
    empty: copy.addressEmpty,
    rate: copy.errorRate,
    maintenance: copy.maintenanceMessage,
    unavailable: copy.geoUnavailable,
  };

  async function resolve() {
    const q = text.trim();
    if (q.length < 3) {
      setPicks([]);
      setNotice('short');
      return;
    }
    setBusy(true);
    setNotice(null);
    setPicks([]);
    try {
      const results = await fetchGeocode(q);
      if (results.length === 0) setNotice('empty');
      else if (results.length === 1) onPick(results[0]);
      else setPicks(results);
    } catch (err) {
      if (err instanceof PublicApiError) {
        if (err.code === 'rate_limited') setNotice('rate');
        else if (err.code === 'maintenance' || err.status === 503) setNotice('maintenance');
        else setNotice('unavailable');
      } else {
        setNotice('unavailable');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className={`flex items-stretch border border-rail/40 ${compact ? '' : 'mt-3'}`}>
        <label className="flex min-w-0 flex-1 items-center px-3 py-2">
          <span className="sr-only">{copy.addressLabel}</span>
          <input
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setNotice(null);
              setPicks([]);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              void resolve();
            }}
            placeholder={copy.addressPlaceholder}
            autoComplete="off"
            disabled={busy}
            className={`w-full min-w-0 bg-transparent ${compact ? 'text-sm' : 'text-base'}`}
          />
        </label>
        <button
          type="button"
          onClick={() => void resolve()}
          disabled={busy}
          className="shrink-0 border-l border-rail/40 px-4 py-2 font-semibold hover:bg-ink hover:text-board disabled:opacity-40"
        >
          {busy ? copy.geocoding : copy.addressUse}
        </button>
      </div>
      {notice ? (
        <p className="mt-2 text-sm text-muted" role="status">
          {noticeCopy[notice]}
        </p>
      ) : null}
      {picks.length > 0 ? (
        <div
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto border border-rail/40 bg-board shadow-lg"
          role="listbox"
          aria-label={copy.addressPick}
        >
          <p className="px-3 pt-2 text-sm font-semibold">{copy.addressPick}</p>
          <ul>
            {picks.map((hit) => (
              <li key={`${hit.lat},${hit.lng},${hit.label}`}>
                <button
                  type="button"
                  onClick={() => {
                    setPicks([]);
                    onPick(hit);
                  }}
                  className="flex w-full border-b border-rail/20 px-3 py-3 text-left text-sm hover:bg-ink hover:text-board"
                >
                  {hit.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
