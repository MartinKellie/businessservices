'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BoardButton,
  BoardField,
  BoardState,
  Chip,
  Flash,
  fieldClass,
} from '@/components/admin/admin-ui';
import {
  AdminApiError,
  adminGet,
  adminSend,
  type AdminCategory,
  type AdminProduct,
  type AdminSynonym,
} from '@/lib/admin-api';
import { hasRole, type AdminRole } from '@/lib/roles';

const TABS = ['categories', 'products', 'synonyms'] as const;
const STATUSES = ['pending', 'approved', 'rejected'] as const;

export function TaxonomyBoard({ role }: { role: AdminRole }) {
  const t = useTranslations('admin');
  const isOwner = hasRole(role, 'owner');
  const [tab, setTab] = useState<(typeof TABS)[number]>('categories');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [cats, setCats] = useState<AdminCategory[] | null>(null);
  const [prods, setProds] = useState<AdminProduct[] | null>(null);
  const [syns, setSyns] = useState<AdminSynonym[] | null>(null);
  const [name, setName] = useState('');
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState<'global' | 'category' | 'product_service'>('global');
  const [flash, setFlash] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  function qs() {
    const params = new URLSearchParams({ limit: '200' });
    if (status) params.set('status', status);
    if (q.trim()) params.set('q', q.trim());
    return params.toString();
  }

  function load() {
    const query = qs();
    adminGet<{ categories: AdminCategory[] }>(`/api/admin/categories?${query}`).then((d) =>
      setCats(d.categories),
    );
    adminGet<{ productsServices: AdminProduct[] }>(`/api/admin/products-services?${query}`).then(
      (d) => setProds(d.productsServices),
    );
    adminGet<{ synonyms: AdminSynonym[] }>(`/api/admin/synonyms?${query}`).then((d) =>
      setSyns(d.synonyms),
    );
  }

  useEffect(load, [status, q]);

  async function review(
    kind: 'categories' | 'products-services' | 'synonyms',
    id: string,
    decision: 'approve' | 'reject',
  ) {
    setFlash(null);
    try {
      await adminSend(`/api/admin/${kind}/${id}/review`, 'POST', {
        decision,
        ...(decision === 'reject' ? { reason: reason[id] || 'Rejected' } : {}),
      });
      load();
    } catch (err) {
      setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">
        {t('taxonomy.title')}
      </h1>
      <p className="mt-2 text-sm text-muted">{t('taxonomy.createRequest')}</p>
      <div className="mt-4 flex flex-wrap gap-1">
        {TABS.map((value) => (
          <Chip key={value} active={tab === value} onClick={() => setTab(value)}>
            {t(`taxonomy.${value}`)}
          </Chip>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <Chip active={!status} onClick={() => setStatus('')}>
          {t('common.all')}
        </Chip>
        {STATUSES.map((value) => (
          <Chip key={value} active={status === value} onClick={() => setStatus(value)}>
            {t(`taxonomyStatus.${value}`)}
          </Chip>
        ))}
      </div>
      <input
        className={`${fieldClass} mt-4`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('common.search')}
      />
      {flash ? (
        <div className="mt-3">
          <Flash tone="err">{flash}</Flash>
        </div>
      ) : null}

      {tab === 'categories' ? (
        <div className="mt-6">
          <div className="flex gap-2">
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('taxonomy.name')}
            />
            <BoardButton
              invert
              onClick={async () => {
                if (name.trim().length < 2) return;
                await adminSend('/api/admin/categories', 'POST', { name: name.trim() });
                setName('');
                load();
              }}
            >
              {t('common.create')}
            </BoardButton>
          </div>
          {!cats ? (
            <BoardState kind="loading" title={t('common.loading')} />
          ) : (
            <ul className="mt-4">
              {cats.map((row) => (
                <TaxonRow
                  key={row.id}
                  name={row.name}
                  status={row.status}
                  isOwner={isOwner}
                  reason={reason[row.id] ?? ''}
                  onReason={(value) => setReason((c) => ({ ...c, [row.id]: value }))}
                  onApprove={() => void review('categories', row.id, 'approve')}
                  onReject={() => void review('categories', row.id, 'reject')}
                  onDelete={
                    isOwner
                      ? async () => {
                          try {
                            await adminSend(`/api/admin/categories/${row.id}`, 'DELETE');
                            load();
                          } catch (err) {
                            setFlash(
                              err instanceof AdminApiError ? err.message : t('taxonomy.inUse'),
                            );
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'products' ? (
        <div className="mt-6">
          <div className="flex gap-2">
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('taxonomy.name')}
            />
            <BoardButton
              invert
              onClick={async () => {
                if (name.trim().length < 2) return;
                await adminSend('/api/admin/products-services', 'POST', { name: name.trim() });
                setName('');
                load();
              }}
            >
              {t('common.create')}
            </BoardButton>
          </div>
          {!prods ? (
            <BoardState kind="loading" title={t('common.loading')} />
          ) : (
            <ul className="mt-4">
              {prods.map((row) => (
                <TaxonRow
                  key={row.id}
                  name={row.name}
                  status={row.status}
                  isOwner={isOwner}
                  reason={reason[row.id] ?? ''}
                  onReason={(value) => setReason((c) => ({ ...c, [row.id]: value }))}
                  onApprove={() => void review('products-services', row.id, 'approve')}
                  onReject={() => void review('products-services', row.id, 'reject')}
                  onDelete={
                    isOwner
                      ? async () => {
                          try {
                            await adminSend(`/api/admin/products-services/${row.id}`, 'DELETE');
                            load();
                          } catch (err) {
                            setFlash(
                              err instanceof AdminApiError ? err.message : t('taxonomy.inUse'),
                            );
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'synonyms' ? (
        <div className="mt-6 space-y-3">
          <BoardField label={t('taxonomy.term')}>
            <input className={fieldClass} value={term} onChange={(e) => setTerm(e.target.value)} />
          </BoardField>
          <BoardField label={t('taxonomy.scope')}>
            <select
              className={fieldClass}
              value={scope}
              onChange={(e) => setScope(e.target.value as typeof scope)}
            >
              <option value="global">{t('taxonomy.scope_global')}</option>
            </select>
          </BoardField>
          <BoardButton
            invert
            onClick={async () => {
              if (term.trim().length < 2) return;
              await adminSend('/api/admin/synonyms', 'POST', { term: term.trim(), scope });
              setTerm('');
              load();
            }}
          >
            {t('common.create')}
          </BoardButton>
          {!syns ? (
            <BoardState kind="loading" title={t('common.loading')} />
          ) : (
            <ul>
              {syns.map((row) => (
                <TaxonRow
                  key={row.id}
                  name={`${row.term} · ${t(`taxonomy.scope_${row.scope}`)}`}
                  status={row.status}
                  isOwner={isOwner}
                  reason={reason[row.id] ?? ''}
                  onReason={(value) => setReason((c) => ({ ...c, [row.id]: value }))}
                  onApprove={() => void review('synonyms', row.id, 'approve')}
                  onReject={() => void review('synonyms', row.id, 'reject')}
                  onDelete={
                    isOwner
                      ? async () => {
                          await adminSend(`/api/admin/synonyms/${row.id}`, 'DELETE');
                          load();
                        }
                      : undefined
                  }
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function TaxonRow({
  name,
  status,
  isOwner,
  reason,
  onReason,
  onApprove,
  onReject,
  onDelete,
}: {
  name: string;
  status: string;
  isOwner: boolean;
  reason: string;
  onReason: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations('admin');
  return (
    <li className="border-b border-rail/20 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{name}</span>
        <span className="text-sm text-muted">{t(`taxonomyStatus.${status}`)}</span>
      </div>
      {isOwner && status === 'pending' ? (
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <input
            className={`${fieldClass} max-w-xs`}
            placeholder={t('common.reason')}
            value={reason}
            onChange={(e) => onReason(e.target.value)}
          />
          <BoardButton invert onClick={onApprove}>
            {t('common.approve')}
          </BoardButton>
          <BoardButton onClick={onReject}>{t('common.reject')}</BoardButton>
        </div>
      ) : null}
      {onDelete ? (
        <button type="button" className="mt-2 text-sm text-muted hover:text-ink" onClick={onDelete}>
          {t('common.delete')}
        </button>
      ) : null}
    </li>
  );
}
