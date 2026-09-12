'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  adminGet,
  adminSend,
  AdminApiError,
  type AdminBusiness,
  type BusinessStatus,
} from '@/lib/admin-api';
import { BoardButton, BoardState, Chip, Flash, fieldClass } from '@/components/admin/admin-ui';

const STATUSES: BusinessStatus[] = [
  'draft',
  'active',
  'temporarily_closed',
  'permanently_closed',
  'relocated',
  'archived',
];

export function BusinessDesk({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const selectedId = pathname.startsWith('/admin/negocios/')
    ? pathname.slice('/admin/negocios/'.length).split('/')[0]
    : null;
  const showingFicha = Boolean(selectedId);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
      <section
        className={`${showingFicha ? 'hidden lg:flex' : 'flex'} w-full min-w-0 flex-col border-rail/40 lg:w-[min(42%,28rem)] lg:border-r`}
      >
        <BusinessList selectedId={selectedId === 'nuevo' ? null : selectedId} />
      </section>
      <section className={`${showingFicha ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col`}>
        {children}
      </section>
    </div>
  );
}

function BusinessList({ selectedId }: { selectedId: string | null }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<BusinessStatus | ''>('');
  const [rows, setRows] = useState<AdminBusiness[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    params.set('limit', '80');
    return params.toString();
  }, [q, status]);

  useEffect(() => {
    let cancelled = false;
    adminGet<{ businesses: AdminBusiness[] }>(`/api/admin/businesses?${query}`)
      .then((data) => {
        if (!cancelled) {
          setError(null);
          setRows(data.businesses);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof AdminApiError ? err.message : t('common.error'));
      });
    return () => {
      cancelled = true;
    };
  }, [query, t]);

  async function createListing() {
    const name = newName.trim();
    if (name.length < 2) return;
    setCreating(true);
    setFlash(null);
    try {
      const { business } = await adminSend<{ business: AdminBusiness }>(
        '/api/admin/businesses',
        'POST',
        { name },
      );
      setNewName('');
      setRows((current) => (current ? [business, ...current] : [business]));
      router.push(`/admin/negocios/${business.id}`);
    } catch (err) {
      setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-rail/40 px-4 py-3">
        <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">
          {t('businesses.title')}
        </h1>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={t('businesses.searchPlaceholder')}
          className={`${fieldClass} mt-3`}
          type="search"
        />
        <div className="mt-3 flex flex-wrap gap-1">
          <Chip active={!status} onClick={() => setStatus('')}>
            {t('common.all')}
          </Chip>
          {STATUSES.map((value) => (
            <Chip key={value} active={status === value} onClick={() => setStatus(value)}>
              {t(`status.${value}`)}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={t('businesses.newName')}
            className={fieldClass}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void createListing();
            }}
          />
          <BoardButton invert pending={creating} onClick={() => void createListing()}>
            {t('businesses.new')}
          </BoardButton>
        </div>
        {flash ? (
          <div className="mt-3">
            <Flash tone="err">{flash}</Flash>
          </div>
        ) : null}
      </div>
      <div className="board-scroll min-h-0 flex-1 overflow-auto">
        {error ? (
          <BoardState kind="error" title={error} />
        ) : rows === null ? (
          <BoardState kind="loading" title={t('common.loading')} />
        ) : rows.length === 0 ? (
          <BoardState kind="empty" title={t('businesses.empty')} />
        ) : (
          <ul>
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/negocios/${row.id}`}
                  className="menu-row flex items-baseline justify-between gap-3 border-b border-rail/20 px-4 py-3"
                  data-selected={selectedId === row.id ? 'true' : 'false'}
                >
                  <span className="font-semibold">{row.name}</span>
                  <span className="shrink-0 text-sm text-muted">{t(`status.${row.status}`)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
