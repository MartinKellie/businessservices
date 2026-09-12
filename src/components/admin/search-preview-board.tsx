'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BoardButton, BoardField, Flash, fieldClass } from '@/components/admin/admin-ui';
import {
  AdminApiError,
  adminGet,
  type SearchPreviewHit,
  type SearchPreviewList,
} from '@/lib/admin-api';
import type { PublicArea } from '@/lib/api-contract';

export function SearchPreviewBoard({ areas }: { areas: PublicArea[] }) {
  const t = useTranslations('admin');
  const [q, setQ] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [hit, setHit] = useState<SearchPreviewHit | null>(null);
  const [list, setList] = useState<SearchPreviewList | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    if (!q.trim()) return;
    setPending(true);
    setFlash(null);
    setHit(null);
    setList(null);
    const params = new URLSearchParams({ q: q.trim() });
    if (businessId.trim()) params.set('businessId', businessId.trim());
    if (areaId) params.set('areaId', areaId);
    try {
      if (businessId.trim()) {
        setHit(await adminGet<SearchPreviewHit>(`/api/admin/search-preview?${params}`));
      } else {
        setList(await adminGet<SearchPreviewList>(`/api/admin/search-preview?${params}`));
      }
    } catch (err) {
      setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">
        {t('preview.title')}
      </h1>
      <div className="mt-6 space-y-4">
        <BoardField label={t('preview.query')}>
          <input className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} />
        </BoardField>
        <BoardField label={t('preview.businessId')}>
          <input
            className={fieldClass}
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
        </BoardField>
        <BoardField label={t('preview.area')}>
          <select className={fieldClass} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
            <option value="">{t('common.all')}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </BoardField>
        <BoardButton invert pending={pending} onClick={() => void run()}>
          {t('preview.run')}
        </BoardButton>
        {flash ? <Flash tone="err">{flash}</Flash> : null}
        {hit ? (
          <p
            className={hit.appears ? 'bg-ink px-3 py-2 text-board' : 'border border-warn px-3 py-2'}
          >
            {hit.appears
              ? `${t('preview.appears')} · ${t('preview.rank', { rank: String(hit.rank), total: String(hit.total) })}`
              : t('preview.missing')}
            {hit.matchedByName ? ` · ${t('preview.matchedName')}` : ''}
          </p>
        ) : null}
        {list ? (
          <ul className="divide-y divide-rail/20">
            {list.results.map((row) => (
              <li key={row.id} className="flex justify-between py-2">
                <span>
                  {row.rank}. {row.name}
                </span>
                <span className="text-sm text-muted">{row.primaryCategory}</span>
              </li>
            ))}
          </ul>
        ) : !hit && !flash ? (
          <p className="text-muted">{t('preview.empty')}</p>
        ) : null}
      </div>
    </div>
  );
}
