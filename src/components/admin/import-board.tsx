'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BoardButton, BoardState, Chip, Flash } from '@/components/admin/admin-ui';
import {
  AdminApiError,
  adminGet,
  adminSend,
  adminUpload,
  type ImportBatch,
  type ImportRow,
} from '@/lib/admin-api';

export function ImportBoard({ batchId }: { batchId?: string }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [batches, setBatches] = useState<ImportBatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function load() {
    adminGet<{ batches: ImportBatch[] }>('/api/admin/imports')
      .then((data) => setBatches(data.batches))
      .catch((err) => setError(err instanceof AdminApiError ? err.message : t('common.error')));
  }

  useEffect(load, [t]);

  async function exportFile(format: 'csv' | 'xlsx') {
    const response = await fetch(`/api/admin/businesses/export?format=${format}`);
    if (!response.ok) {
      setFlash(t('common.failed'));
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0">
      <section
        className={`${batchId ? 'hidden lg:flex' : 'flex'} w-full min-w-0 flex-col border-rail/40 lg:w-[min(42%,28rem)] lg:border-r`}
      >
        <div className="border-b border-rail/40 px-4 py-3">
          <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">
            {t('imports.title')}
          </h1>
          <p className="mt-2 text-sm text-muted">{t('imports.hint')}</p>
          <label className="mt-3 block text-sm">
            {t('imports.upload')}
            <input
              type="file"
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="mt-1 block"
              disabled={pending}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setPending(true);
                setFlash(null);
                const form = new FormData();
                form.set('file', file);
                try {
                  const { batch } = await adminUpload<{ batch: ImportBatch }>('/api/admin/imports', form);
                  load();
                  router.push(`/admin/importar/${batch.id}`);
                } catch (err) {
                  setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
                } finally {
                  setPending(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
          <div className="mt-3 flex gap-2">
            <BoardButton onClick={() => void exportFile('csv')}>{t('imports.exportCsv')}</BoardButton>
            <BoardButton onClick={() => void exportFile('xlsx')}>{t('imports.exportXlsx')}</BoardButton>
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
          ) : batches === null ? (
            <BoardState kind="loading" title={t('common.loading')} />
          ) : batches.length === 0 ? (
            <BoardState kind="empty" title={t('imports.empty')} />
          ) : (
            <ul>
              {batches.map((batch) => (
                <li key={batch.id}>
                  <Link
                    href={`/admin/importar/${batch.id}`}
                    className="menu-row block border-b border-rail/20 px-4 py-3"
                    data-selected={batchId === batch.id ? 'true' : 'false'}
                  >
                    <span className="font-semibold">{batch.filename}</span>
                    <span className="mt-1 block text-sm text-muted">
                      {t(`imports.${batch.status}`)} · {batch.validRows} {t('imports.valid')} ·{' '}
                      {batch.errorRows} {t('imports.errors')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className={`${batchId ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col`}>
        {batchId ? <ImportReview id={batchId} /> : <div className="p-8 text-muted">{t('imports.hint')}</div>}
      </section>
    </div>
  );
}

function ImportReview({ id }: { id: string }) {
  const t = useTranslations('admin');
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  function load() {
    adminGet<{ batch: ImportBatch }>(`/api/admin/imports/${id}`).then((d) => setBatch(d.batch));
    const params = onlyErrors ? '?onlyErrors=1' : '';
    adminGet<{ rows: ImportRow[] }>(`/api/admin/imports/${id}/rows${params}`).then((d) => setRows(d.rows));
  }

  useEffect(load, [id, onlyErrors]);

  if (!batch || !rows) return <BoardState kind="loading" title={t('common.loading')} />;

  return (
    <div className="admin-ficha board-scroll h-full overflow-auto px-4 py-4">
      <Link href="/admin/importar" className="text-sm lg:hidden underline-offset-4 hover:underline">
        {t('common.back')}
      </Link>
      <h1 className="mt-3 font-display text-2xl font-extrabold tracking-wide uppercase">
        {batch.filename}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {t(`imports.${batch.status}`)} · {batch.validRows} {t('imports.valid')} · {batch.errorRows}{' '}
        {t('imports.errors')}
        {batch.committedRows ? ` · ${batch.committedRows} ${t('imports.committedRows')}` : ''}
      </p>
      <div className="mt-3">
        <Chip active={onlyErrors} onClick={() => setOnlyErrors((v) => !v)}>
          {t('imports.onlyErrors')}
        </Chip>
      </div>
      {flash ? (
        <div className="mt-3">
          <Flash tone="err">{flash}</Flash>
        </div>
      ) : null}
      {batch.status === 'pending_review' ? (
        <div className="mt-4 flex gap-2">
          <BoardButton
            invert
            pending={pending}
            onClick={async () => {
              setPending(true);
              try {
                await adminSend(`/api/admin/imports/${id}/commit`, 'POST', {});
                load();
              } catch (err) {
                setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
              } finally {
                setPending(false);
              }
            }}
          >
            {t('imports.commit')}
          </BoardButton>
          <BoardButton
            onClick={async () => {
              await adminSend(`/api/admin/imports/${id}/discard`, 'POST', {});
              load();
            }}
          >
            {t('imports.discard')}
          </BoardButton>
        </div>
      ) : null}
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-rail/40">
            <th className="py-2 pr-3">{t('imports.row')}</th>
            <th className="py-2">name</th>
            <th className="py-2">{t('common.filter')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-rail/20 align-top">
              <td className="py-2 pr-3">{row.rowNumber}</td>
              <td className="py-2 pr-3">{row.raw.name}</td>
              <td className="py-2">
                {row.ok ? (
                  t('imports.valid')
                ) : (
                  <span className="text-warn">
                    {row.errors ? Object.values(row.errors).join(' ') : t('imports.errors')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
