'use client';

import Link from 'next/link';
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
  type AdminEnquiry,
  type AdminEnquiryRow,
} from '@/lib/admin-api';

const TYPES = ['add_business', 'update_listing', 'advertising', 'general'] as const;
const STATUSES = ['new', 'in_progress', 'closed'] as const;

export function EnquiryBoard({ selectedId }: { selectedId?: string }) {
  const t = useTranslations('admin');
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [rows, setRows] = useState<AdminEnquiryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    params.set('limit', '80');
    adminGet<{ enquiries: AdminEnquiryRow[] }>(`/api/admin/enquiries?${params}`)
      .then((data) => setRows(data.enquiries))
      .catch((err) => setError(err instanceof AdminApiError ? err.message : t('common.error')));
  }, [status, type, t]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
      <section
        className={`${selectedId ? 'hidden lg:flex' : 'flex'} w-full min-w-0 flex-col border-rail/40 lg:w-[min(42%,28rem)] lg:border-r`}
      >
        <div className="border-b border-rail/40 px-4 py-3">
          <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">
            {t('enquiries.title')}
          </h1>
          <div className="mt-3 flex flex-wrap gap-1">
            <Chip active={!status} onClick={() => setStatus('')}>
              {t('common.all')}
            </Chip>
            {STATUSES.map((value) => (
              <Chip key={value} active={status === value} onClick={() => setStatus(value)}>
                {t(`enquiryStatus.${value}`)}
              </Chip>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {TYPES.map((value) => (
              <Chip
                key={value}
                active={type === value}
                onClick={() => setType(type === value ? '' : value)}
              >
                {t(`enquiryType.${value}`)}
              </Chip>
            ))}
          </div>
        </div>
        <div className="board-scroll min-h-0 flex-1 overflow-auto">
          {error ? (
            <BoardState kind="error" title={error} />
          ) : rows === null ? (
            <BoardState kind="loading" title={t('common.loading')} />
          ) : rows.length === 0 ? (
            <BoardState kind="empty" title={t('enquiries.empty')} />
          ) : (
            <ul>
              {rows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/admin/consultas/${row.id}`}
                    className="menu-row block border-b border-rail/20 px-4 py-3"
                    data-selected={selectedId === row.id ? 'true' : 'false'}
                  >
                    <span className="font-semibold">{row.name}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {t(`enquiryType.${row.type}`)} · {t(`enquiryStatus.${row.status}`)}
                      {row.uploadCount ? ` · ${row.uploadCount}` : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col`}>
        {selectedId ? (
          <EnquiryFicha id={selectedId} />
        ) : (
          <div className="flex h-full items-center px-8 text-muted">{t('enquiries.empty')}</div>
        )}
      </section>
    </div>
  );
}

function EnquiryFicha({ id }: { id: string }) {
  const t = useTranslations('admin');
  const [item, setItem] = useState<AdminEnquiry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [flash, setFlash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function load() {
    adminGet<{ enquiry: AdminEnquiry }>(`/api/admin/enquiries/${id}`)
      .then((data) => {
        setItem(data.enquiry);
        setStatus(data.enquiry.status);
        setNotes(data.enquiry.adminNotes ?? '');
        setBusinessId(data.enquiry.businessId ?? '');
      })
      .catch((err) => setError(err instanceof AdminApiError ? err.message : t('common.error')));
  }

  useEffect(load, [id, t]);

  if (error) return <BoardState kind="error" title={error} />;
  if (!item) return <BoardState kind="loading" title={t('common.loading')} />;

  return (
    <div className="admin-ficha board-scroll h-full overflow-auto px-4 py-4">
      <Link
        href="/admin/consultas"
        className="text-sm lg:hidden underline-offset-4 hover:underline"
      >
        {t('common.back')}
      </Link>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-wide uppercase">
        {item.name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {item.email}
        {item.phone ? ` · ${item.phone}` : ''}
      </p>
      <p className="mt-4 whitespace-pre-wrap">{item.message}</p>
      {item.businessReference ? (
        <p className="mt-2 text-sm">
          {t('enquiries.reference')}: {item.businessReference}
        </p>
      ) : null}
      <div className="mt-6 space-y-4">
        <BoardField label={t('common.filter')}>
          <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(`enquiryStatus.${value}`)}
              </option>
            ))}
          </select>
        </BoardField>
        <BoardField label={t('enquiries.adminNotes')}>
          <textarea
            className={`${fieldClass} min-h-24`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </BoardField>
        <BoardField label={t('enquiries.linkBusiness')}>
          <input
            className={fieldClass}
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
          />
        </BoardField>
        {flash ? <Flash tone="err">{flash}</Flash> : null}
        <BoardButton
          invert
          pending={pending}
          onClick={async () => {
            setPending(true);
            setFlash(null);
            try {
              await adminSend(`/api/admin/enquiries/${id}`, 'PATCH', {
                status,
                adminNotes: notes || null,
                businessId: businessId || null,
              });
              load();
            } catch (err) {
              setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
            } finally {
              setPending(false);
            }
          }}
        >
          {t('common.save')}
        </BoardButton>
      </div>
      <h2 className="mt-8 font-display text-xl font-extrabold tracking-wide uppercase">
        {t('enquiries.uploads')}
      </h2>
      <ul className="mt-3 space-y-4">
        {item.uploads.map((upload) => (
          <li key={upload.id} className="border border-rail/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={upload.blobUrl} alt="" className="max-h-48" />
            <p className="mt-2 text-sm">{t(`mediaStatus.${upload.reviewStatus}`)}</p>
            {upload.reviewStatus === 'pending' ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <BoardButton
                  onClick={async () => {
                    await adminSend(`/api/admin/enquiry-uploads/${upload.id}/review`, 'POST', {
                      decision: 'reject',
                    });
                    load();
                  }}
                >
                  {t('common.reject')}
                </BoardButton>
                <BoardButton
                  invert
                  onClick={async () => {
                    await adminSend(`/api/admin/enquiry-uploads/${upload.id}/review`, 'POST', {
                      decision: 'approve',
                      ...(businessId
                        ? { promoteToBusinessId: businessId, promoteAs: 'photo' }
                        : {}),
                    });
                    load();
                  }}
                >
                  {t('common.approve')}
                </BoardButton>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
