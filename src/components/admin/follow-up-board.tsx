'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BoardButton, BoardState, Chip } from '@/components/admin/admin-ui';
import { AdminApiError, adminGet, adminSend, dateInputValue, type AdminFollowUp } from '@/lib/admin-api';

export function FollowUpBoard() {
  const t = useTranslations('admin');
  const [filter, setFilter] = useState<'open' | 'due' | 'overdue'>('open');
  const [rows, setRows] = useState<AdminFollowUp[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    adminGet<{ followUps: AdminFollowUp[] }>(`/api/admin/follow-ups?filter=${filter}`)
      .then((data) => setRows(data.followUps))
      .catch((err) => setError(err instanceof AdminApiError ? err.message : t('common.error')));
  }

  useEffect(load, [filter, t]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">
        {t('followUps.title')}
      </h1>
      <div className="mt-4 flex flex-wrap gap-1">
        {(['open', 'due', 'overdue'] as const).map((value) => (
          <Chip key={value} active={filter === value} onClick={() => setFilter(value)}>
            {t(`followUps.${value}`)}
          </Chip>
        ))}
      </div>
      <div className="mt-6">
        {error ? (
          <BoardState kind="error" title={error} />
        ) : rows === null ? (
          <BoardState kind="loading" title={t('common.loading')} />
        ) : rows.length === 0 ? (
          <BoardState kind="empty" title={t('followUps.empty')} />
        ) : (
          <ul>
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rail/20 py-3"
              >
                <div>
                  <Link
                    href={`/admin/negocios/${row.businessId}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {row.businessName}
                  </Link>
                  <p className={`text-sm ${row.overdue ? 'text-warn' : 'text-muted'}`}>
                    {dateInputValue(row.dueOn)}
                    {row.note ? ` · ${row.note}` : ''}
                  </p>
                </div>
                <BoardButton
                  onClick={async () => {
                    await adminSend(`/api/admin/follow-ups/${row.id}/complete`, 'POST', {});
                    load();
                  }}
                >
                  {t('followUps.complete')}
                </BoardButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
