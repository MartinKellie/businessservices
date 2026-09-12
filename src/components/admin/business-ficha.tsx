'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PinPicker } from '@/components/admin/pin-picker';
import { BoardButton, BoardField, BoardState, Flash, fieldClass } from '@/components/admin/admin-ui';
import type { PublicArea } from '@/lib/api-contract';
import {
  AdminApiError,
  HIGH_RISK_FIELDS,
  OWNER_ONLY_STATUS,
  STATUS_TRANSITIONS,
  STRONG_VERIFICATION,
  adminGet,
  adminSend,
  adminUpload,
  dateInputValue,
  timeInputValue,
  type AdminBusinessDetail,
  type AdminCategory,
  type AdminContactEntry,
  type AdminFollowUp,
  type AdminMedia,
  type AdminNote,
  type AdminProduct,
  type BusinessStatus,
  type PublishReport,
} from '@/lib/admin-api';
import { hasRole, type AdminRole } from '@/lib/roles';

export function BusinessFicha({
  id,
  areas,
  role,
}: {
  id: string;
  areas: PublicArea[];
  role: AdminRole;
}) {
  const t = useTranslations('admin');
  const [biz, setBiz] = useState<AdminBusinessDetail | null>(null);
  const [report, setReport] = useState<PublishReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [detail, readiness] = await Promise.all([
      adminGet<{ business: AdminBusinessDetail }>(`/api/admin/businesses/${id}`),
      adminGet<PublishReport>(`/api/admin/businesses/${id}/status`),
    ]);
    setBiz(detail.business);
    setReport(readiness);
  }

  useEffect(() => {
    let cancelled = false;
    setBiz(null);
    setError(null);
    reload().catch((err) => {
      if (!cancelled) setError(err instanceof AdminApiError ? err.message : t('common.error'));
    });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (error) return <BoardState kind="error" title={error} />;
  if (!biz || !report) return <BoardState kind="loading" title={t('common.loading')} />;

  return (
    <div className="admin-ficha board-scroll h-full overflow-auto">
      <div className="border-b border-rail/40 px-4 py-3 lg:hidden">
        <Link href="/admin/negocios" className="text-sm underline-offset-4 hover:underline">
          {t('common.back')}
        </Link>
      </div>
      <header className="border-b border-rail/40 px-4 py-4">
        <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">{biz.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {t(`status.${biz.status}`)} · {biz.slug}
        </p>
        {report.publishable ? (
          <p className="mt-3 bg-ink px-3 py-2 text-sm text-board">{t('ficha.publishable')}</p>
        ) : (
          <div className="mt-3 border border-warn px-3 py-2 text-sm">
            <p className="font-semibold">{t('ficha.blockers')}</p>
            <ul className="mt-1 list-disc pl-5">
              {report.problems.map((problem) => (
                <li key={problem.field}>{problem.message}</li>
              ))}
            </ul>
          </div>
        )}
      </header>
      <IdentitySection key={`${biz.id}-id-${biz.updatedAt}`} biz={biz} onSaved={reload} />
      <TaxonomySection key={`${biz.id}-tax`} biz={biz} onSaved={reload} />
      <PremisesSection key={`${biz.id}-pre`} biz={biz} areas={areas} onSaved={reload} />
      <HoursSection key={`${biz.id}-hrs-${biz.openingHours.length}`} biz={biz} onSaved={reload} />
      <MediaSection id={id} />
      <OpsSection id={id} />
      <StatusSection biz={biz} role={role} onSaved={reload} />
      <PreviewSection id={id} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-rail/40 px-4 py-5">
      <h2 className="font-display text-xl font-extrabold tracking-wide uppercase">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function IdentitySection({ biz, onSaved }: { biz: AdminBusinessDetail; onSaved: () => Promise<void> }) {
  const t = useTranslations('admin');
  const [form, setForm] = useState({
    name: biz.name,
    phone: biz.phone ?? '',
    whatsapp: biz.whatsapp ?? '',
    email: biz.email ?? '',
    website: biz.website ?? '',
    instagram: biz.instagram ?? '',
    facebook: biz.facebook ?? '',
  });
  const [level, setLevel] = useState(biz.verificationLevel ?? 'visited');
  const [method, setMethod] = useState(biz.verificationMethod ?? 'shop_visit');
  const [source, setSource] = useState(biz.verificationSource ?? '');
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const highRiskChanged = HIGH_RISK_FIELDS.some(
    (field) => (form[field] || null) !== (biz[field] ?? null),
  );

  async function save() {
    setPending(true);
    setFlash(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        website: form.website || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
      };
      if (highRiskChanged || source !== (biz.verificationSource ?? '')) {
        payload.verification = { level, method, source: source || undefined };
      }
      await adminSend(`/api/admin/businesses/${biz.id}`, 'PATCH', payload);
      await onSaved();
      setFlash({ tone: 'ok', text: t('common.saved') });
    } catch (err) {
      setFlash({
        tone: 'err',
        text: err instanceof AdminApiError ? err.message : t('common.failed'),
      });
    } finally {
      setPending(false);
    }
  }

  function set(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <Section title={t('ficha.identity')}>
      <BoardField label={t('ficha.name')}>
        <input className={fieldClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
      </BoardField>
      <div className="grid gap-4 sm:grid-cols-2">
        {(['phone', 'whatsapp', 'email', 'website', 'instagram', 'facebook'] as const).map((field) => (
          <BoardField key={field} label={t(`ficha.${field}`)}>
            <input
              className={fieldClass}
              value={form[field]}
              onChange={(e) => set(field, e.target.value)}
            />
          </BoardField>
        ))}
      </div>
      <p className="text-sm text-muted">{t('ficha.verificationNeeded')}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <BoardField label={t('ficha.level')}>
          <select className={fieldClass} value={level} onChange={(e) => setLevel(e.target.value)}>
            {['researched', 'contacted', 'phone_verified', 'visited', 'business_claimed'].map((value) => (
              <option key={value} value={value} disabled={highRiskChanged && !STRONG_VERIFICATION.includes(value as never)}>
                {t(`ficha.level_${value}`)}
              </option>
            ))}
          </select>
        </BoardField>
        <BoardField label={t('ficha.method')}>
          <select className={fieldClass} value={method} onChange={(e) => setMethod(e.target.value)}>
            {[
              'public_information',
              'phone_call',
              'shop_visit',
              'local_contact',
              'business_confirmation',
              'other',
            ].map((value) => (
              <option key={value} value={value}>
                {t(`ficha.method_${value}`)}
              </option>
            ))}
          </select>
        </BoardField>
        <BoardField label={t('ficha.source')}>
          <input className={fieldClass} value={source} onChange={(e) => setSource(e.target.value)} />
        </BoardField>
      </div>
      {biz.lastVerifiedAt ? (
        <p className="text-sm text-muted">
          {t('ficha.lastVerified')}: {new Date(biz.lastVerifiedAt).toLocaleString()}
        </p>
      ) : null}
      {flash ? <Flash tone={flash.tone}>{flash.text}</Flash> : null}
      <BoardButton invert pending={pending} onClick={() => void save()}>
        {t('common.save')}
      </BoardButton>
    </Section>
  );
}

function TaxonomySection({ biz, onSaved }: { biz: AdminBusinessDetail; onSaved: () => Promise<void> }) {
  const t = useTranslations('admin');
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [prods, setProds] = useState<AdminProduct[]>([]);
  const [primary, setPrimary] = useState(biz.categories.find((c) => c.isPrimary)?.id ?? '');
  const [secondary, setSecondary] = useState(
    biz.categories.filter((c) => !c.isPrimary).map((c) => c.id),
  );
  const [picked, setPicked] = useState(biz.productsServices.map((p) => p.id));
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    adminGet<{ categories: AdminCategory[] }>('/api/admin/categories?status=approved&limit=200').then(
      (data) => setCats(data.categories),
    );
    adminGet<{ productsServices: AdminProduct[] }>(
      '/api/admin/products-services?status=approved&limit=200',
    ).then((data) => setProds(data.productsServices));
  }, []);

  async function saveCats() {
    if (!primary) return;
    setPending(true);
    setFlash(null);
    try {
      await adminSend(`/api/admin/businesses/${biz.id}/categories`, 'PUT', {
        primaryCategoryId: primary,
        secondaryCategoryIds: secondary.filter((id) => id !== primary),
      });
      await onSaved();
    } catch (err) {
      setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
    } finally {
      setPending(false);
    }
  }

  async function saveProds() {
    setPending(true);
    setFlash(null);
    try {
      await adminSend(`/api/admin/businesses/${biz.id}/products-services`, 'PUT', {
        productServiceIds: picked,
      });
      await onSaved();
    } catch (err) {
      setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Section title={t('ficha.categories')}>
        {cats.length === 0 ? (
          <p className="text-sm text-muted">{t('ficha.noApprovedCategories')}</p>
        ) : (
          <>
            <BoardField label={t('ficha.primaryCategory')}>
              <select className={fieldClass} value={primary} onChange={(e) => setPrimary(e.target.value)}>
                <option value="">{t('common.choose')}</option>
                {cats.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </BoardField>
            <fieldset>
              <legend className="text-sm font-semibold">{t('ficha.secondaryCategories')}</legend>
              <div className="mt-2 columns-1 gap-2 sm:columns-2">
                {cats
                  .filter((cat) => cat.id !== primary)
                  .map((cat) => (
                    <label key={cat.id} className="mb-1 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="board-check"
                        checked={secondary.includes(cat.id)}
                        onChange={(e) =>
                          setSecondary((current) =>
                            e.target.checked ? [...current, cat.id] : current.filter((id) => id !== cat.id),
                          )
                        }
                      />
                      {cat.name}
                    </label>
                  ))}
              </div>
            </fieldset>
            <BoardButton invert pending={pending} onClick={() => void saveCats()}>
              {t('common.save')}
            </BoardButton>
          </>
        )}
      </Section>
      <Section title={t('ficha.products')}>
        {prods.length === 0 ? (
          <p className="text-sm text-muted">{t('ficha.noApprovedProducts')}</p>
        ) : (
          <>
            <div className="columns-1 gap-2 sm:columns-2">
              {prods.map((prod) => (
                <label key={prod.id} className="mb-1 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="board-check"
                    checked={picked.includes(prod.id)}
                    onChange={(e) =>
                      setPicked((current) =>
                        e.target.checked ? [...current, prod.id] : current.filter((id) => id !== prod.id),
                      )
                    }
                  />
                  {prod.name}
                </label>
              ))}
            </div>
            <BoardButton invert pending={pending} onClick={() => void saveProds()}>
              {t('common.save')}
            </BoardButton>
          </>
        )}
        {flash ? <Flash tone="err">{flash}</Flash> : null}
      </Section>
    </>
  );
}

function PremisesSection({
  biz,
  areas,
  onSaved,
}: {
  biz: AdminBusinessDetail;
  areas: PublicArea[];
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations('admin');
  const p = biz.premises;
  const [kind, setKind] = useState<'physical' | 'service_area'>(p?.kind ?? 'physical');
  const [address, setAddress] = useState(p?.addressLine ?? '');
  const [areaId, setAreaId] = useState(p?.areaId ?? '');
  const [note, setNote] = useState(p?.serviceAreaNote ?? '');
  const [lat, setLat] = useState<number | null>(p?.lat ?? null);
  const [lng, setLng] = useState<number | null>(p?.lng ?? null);
  const [precision, setPrecision] = useState(p?.locationPrecision ?? 'exact');
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  async function save() {
    setPending(true);
    setFlash(null);
    try {
      await adminSend(`/api/admin/businesses/${biz.id}/premises`, 'PUT', {
        kind,
        areaId: areaId || undefined,
        addressLine: kind === 'physical' ? address || undefined : undefined,
        serviceAreaNote: kind === 'service_area' ? note || undefined : undefined,
        locationPrecision: kind === 'physical' ? precision : undefined,
        ...(kind === 'physical' && lat != null && lng != null ? { lat, lng } : {}),
      });
      await onSaved();
      setFlash({ tone: 'ok', text: t('common.saved') });
    } catch (err) {
      setFlash({
        tone: 'err',
        text: err instanceof AdminApiError ? err.message : t('common.failed'),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title={t('ficha.premises')}>
      <div className="flex gap-2">
        <BoardButton invert={kind === 'physical'} onClick={() => setKind('physical')}>
          {t('ficha.kindPhysical')}
        </BoardButton>
        <BoardButton invert={kind === 'service_area'} onClick={() => setKind('service_area')}>
          {t('ficha.kindService')}
        </BoardButton>
      </div>
      <BoardField label={t('ficha.area')}>
        <select className={fieldClass} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
          <option value="">{t('common.choose')}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </BoardField>
      {kind === 'physical' ? (
        <>
          <BoardField label={t('ficha.address')}>
            <input className={fieldClass} value={address} onChange={(e) => setAddress(e.target.value)} />
          </BoardField>
          <p className="text-sm text-muted">{t('ficha.mapHint')}</p>
          <PinPicker
            lat={lat}
            lng={lng}
            onPick={(nextLat, nextLng) => {
              setLat(nextLat);
              setLng(nextLng);
            }}
          />
          <BoardField label={t('ficha.precision')}>
            <select
              className={fieldClass}
              value={precision}
              onChange={(e) => setPrecision(e.target.value as typeof precision)}
            >
              <option value="exact">{t('ficha.exact')}</option>
              <option value="approximate">{t('ficha.approximate')}</option>
              <option value="area_only">{t('ficha.areaOnly')}</option>
            </select>
          </BoardField>
        </>
      ) : (
        <BoardField label={t('ficha.serviceAreaNote')}>
          <textarea
            className={`${fieldClass} min-h-24`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </BoardField>
      )}
      {flash ? <Flash tone={flash.tone}>{flash.text}</Flash> : null}
      <BoardButton invert pending={pending} onClick={() => void save()}>
        {t('common.save')}
      </BoardButton>
    </Section>
  );
}

function HoursSection({ biz, onSaved }: { biz: AdminBusinessDetail; onSaved: () => Promise<void> }) {
  const t = useTranslations('admin');
  const [entries, setEntries] = useState(
    biz.openingHours.map((row) => ({
      dayOfWeek: row.dayOfWeek,
      opensAt: timeInputValue(row.opensAt),
      closesAt: timeInputValue(row.closesAt),
    })),
  );
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setFlash(null);
    try {
      await adminSend(`/api/admin/businesses/${biz.id}/hours`, 'PUT', { entries });
      await onSaved();
    } catch (err) {
      setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title={t('ficha.hours')}>
      <p className="text-sm text-muted">{t('ficha.hoursHint')}</p>
      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
        const shifts = entries.filter((e) => e.dayOfWeek === day);
        return (
          <div key={day} className="border-t border-rail/20 pt-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{t(`ficha.day${day}`)}</p>
              <button
                type="button"
                className="text-sm underline-offset-4 hover:underline"
                onClick={() =>
                  setEntries((current) => [
                    ...current,
                    { dayOfWeek: day, opensAt: '08:00', closesAt: '18:00' },
                  ])
                }
              >
                {t('ficha.addShift')}
              </button>
            </div>
            {shifts.length === 0 ? (
              <p className="mt-1 text-sm text-muted">{t('ficha.closedDay')}</p>
            ) : (
              entries.map((shift, at) =>
                shift.dayOfWeek !== day ? null : (
                  <div key={`${day}-${at}`} className="mt-2 flex items-center gap-2">
                    <label className="text-sm">
                      {t('ficha.opens')}
                      <input
                        type="time"
                        className={`${fieldClass} ml-2 w-auto`}
                        value={shift.opensAt}
                        onChange={(e) =>
                          setEntries((current) =>
                            current.map((row, i) => (i === at ? { ...row, opensAt: e.target.value } : row)),
                          )
                        }
                      />
                    </label>
                    <label className="text-sm">
                      {t('ficha.closes')}
                      <input
                        type="time"
                        className={`${fieldClass} ml-2 w-auto`}
                        value={shift.closesAt}
                        onChange={(e) =>
                          setEntries((current) =>
                            current.map((row, i) => (i === at ? { ...row, closesAt: e.target.value } : row)),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="text-sm text-muted hover:text-ink"
                      onClick={() => setEntries((current) => current.filter((_, i) => i !== at))}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                ),
              )
            )}
          </div>
        );
      })}
      {flash ? <Flash tone="err">{flash}</Flash> : null}
      <BoardButton invert pending={pending} onClick={() => void save()}>
        {t('common.save')}
      </BoardButton>
    </Section>
  );
}

function MediaSection({ id }: { id: string }) {
  const t = useTranslations('admin');
  const [media, setMedia] = useState<AdminMedia[] | null>(null);
  const [pending, setPending] = useState(false);

  function load() {
    adminGet<{ media: AdminMedia[] }>(`/api/admin/businesses/${id}/media`).then((data) =>
      setMedia(data.media),
    );
  }

  useEffect(load, [id]);

  async function upload(type: 'logo' | 'photo', file: File) {
    setPending(true);
    const form = new FormData();
    form.set('file', file);
    form.set('type', type);
    try {
      await adminUpload(`/api/admin/businesses/${id}/media`, form);
      load();
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title={t('ficha.media')}>
      {media === null ? (
        <BoardState kind="loading" title={t('common.loading')} />
      ) : (
        <div className="flex flex-wrap gap-3">
          {media.map((item) => (
            <figure key={item.id} className="w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.blobUrl} alt={item.altText ?? ''} className="h-28 w-28 object-cover" />
              <figcaption className="mt-1 text-xs text-muted">
                {t(`ficha.${item.type}`)} · {t(`mediaStatus.${item.reviewStatus}`)}
              </figcaption>
              <button
                type="button"
                className="mt-1 text-xs underline-offset-4 hover:underline"
                onClick={async () => {
                  await adminSend(`/api/admin/media/${item.id}`, 'DELETE');
                  load();
                }}
              >
                {t('common.delete')}
              </button>
            </figure>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        {(['logo', 'photo'] as const).map((type) => (
          <label key={type} className="text-sm">
            {t(`ficha.${type}`)}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 block"
              disabled={pending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(type, file);
                e.target.value = '';
              }}
            />
          </label>
        ))}
      </div>
    </Section>
  );
}

function OpsSection({ id }: { id: string }) {
  const t = useTranslations('admin');
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [history, setHistory] = useState<AdminContactEntry[]>([]);
  const [follow, setFollow] = useState<AdminFollowUp | null>(null);
  const [noteBody, setNoteBody] = useState('');
  const [outcome, setOutcome] = useState('');
  const [method, setMethod] = useState<AdminContactEntry['method']>('whatsapp');
  const [dueOn, setDueOn] = useState('');
  const [followNote, setFollowNote] = useState('');

  function load() {
    adminGet<{ notes: AdminNote[] }>(`/api/admin/businesses/${id}/notes`).then((d) => setNotes(d.notes));
    adminGet<{ contactHistory: AdminContactEntry[] }>(
      `/api/admin/businesses/${id}/contact-history`,
    ).then((d) => setHistory(d.contactHistory));
    adminGet<{ followUp: AdminFollowUp | null }>(`/api/admin/businesses/${id}/follow-up`).then((d) => {
      setFollow(d.followUp);
      setDueOn(dateInputValue(d.followUp?.dueOn));
      setFollowNote(d.followUp?.note ?? '');
    });
  }

  useEffect(load, [id]);

  return (
    <>
      <Section title={t('ficha.notes')}>
        <ul className="space-y-2 text-sm">
          {notes.map((note) => (
            <li key={note.id} className="border-b border-rail/20 pb-2">
              <p>{note.body}</p>
              <p className="text-muted">{new Date(note.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
        <textarea
          className={`${fieldClass} min-h-20`}
          placeholder={t('ficha.notePlaceholder')}
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
        />
        <BoardButton
          invert
          onClick={async () => {
            if (!noteBody.trim()) return;
            await adminSend(`/api/admin/businesses/${id}/notes`, 'POST', { body: noteBody });
            setNoteBody('');
            load();
          }}
        >
          {t('ficha.addNote')}
        </BoardButton>
      </Section>
      <Section title={t('ficha.history')}>
        <ul className="space-y-2 text-sm">
          {history.map((row) => (
            <li key={row.id}>
              {dateInputValue(row.contactedOn)} · {t(`ficha.contact_${row.method}`)}
              {row.outcome ? ` — ${row.outcome}` : ''}
            </li>
          ))}
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
          <BoardField label={t('ficha.contactMethod')}>
            <select
              className={fieldClass}
              value={method}
              onChange={(e) => setMethod(e.target.value as AdminContactEntry['method'])}
            >
              {(['phone', 'whatsapp', 'email', 'visit', 'other'] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`ficha.contact_${value}`)}
                </option>
              ))}
            </select>
          </BoardField>
          <BoardField label={t('ficha.outcome')}>
            <input className={fieldClass} value={outcome} onChange={(e) => setOutcome(e.target.value)} />
          </BoardField>
        </div>
        <BoardButton
          invert
          onClick={async () => {
            await adminSend(`/api/admin/businesses/${id}/contact-history`, 'POST', {
              method,
              outcome: outcome || undefined,
            });
            setOutcome('');
            load();
          }}
        >
          {t('common.save')}
        </BoardButton>
      </Section>
      <Section title={t('ficha.followUp')}>
        {follow ? (
          <p className="text-sm">
            {dateInputValue(follow.dueOn)}
            {follow.note ? ` — ${follow.note}` : ''}
          </p>
        ) : (
          <p className="text-sm text-muted">{t('ficha.noFollowUp')}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <BoardField label={t('ficha.dueOn')}>
            <input
              type="date"
              className={fieldClass}
              value={dueOn}
              onChange={(e) => setDueOn(e.target.value)}
            />
          </BoardField>
          <BoardField label={t('ficha.followNote')}>
            <input className={fieldClass} value={followNote} onChange={(e) => setFollowNote(e.target.value)} />
          </BoardField>
        </div>
        <div className="flex flex-wrap gap-2">
          <BoardButton
            invert
            onClick={async () => {
              if (!dueOn) return;
              await adminSend(`/api/admin/businesses/${id}/follow-up`, 'PUT', {
                dueOn,
                note: followNote || undefined,
              });
              load();
            }}
          >
            {t('common.save')}
          </BoardButton>
          {follow ? (
            <>
              <BoardButton
                onClick={async () => {
                  await adminSend(`/api/admin/follow-ups/${follow.id}/complete`, 'POST', {});
                  load();
                }}
              >
                {t('ficha.completeFollowUp')}
              </BoardButton>
              <BoardButton
                onClick={async () => {
                  await adminSend(`/api/admin/businesses/${id}/follow-up`, 'DELETE');
                  load();
                }}
              >
                {t('ficha.clearFollowUp')}
              </BoardButton>
            </>
          ) : null}
        </div>
      </Section>
    </>
  );
}

function StatusSection({
  biz,
  role,
  onSaved,
}: {
  biz: AdminBusinessDetail;
  role: AdminRole;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations('admin');
  const [next, setNext] = useState('');
  const [relocatedTo, setRelocatedTo] = useState('');
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const isOwner = hasRole(role, 'owner');
  const options = STATUS_TRANSITIONS[biz.status].filter(
    (status) => isOwner || !OWNER_ONLY_STATUS.includes(status),
  );

  async function apply() {
    if (!next) return;
    setPending(true);
    setFlash(null);
    try {
      await adminSend(`/api/admin/businesses/${biz.id}/status`, 'POST', {
        status: next,
        relocatedToBusinessId: next === 'relocated' ? relocatedTo : undefined,
      });
      await onSaved();
      setNext('');
    } catch (err) {
      setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
    } finally {
      setPending(false);
    }
  }

  return (
    <Section title={t('ficha.status')}>
      <p className="text-sm">
        {t(`status.${biz.status}`)}
        {!isOwner ? <span className="block text-muted">{t('ficha.ownerOnlyStatus')}</span> : null}
      </p>
      <BoardField label={t('ficha.setStatus')}>
        <select className={fieldClass} value={next} onChange={(e) => setNext(e.target.value)}>
          <option value="">{t('common.choose')}</option>
          {options.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>
      </BoardField>
      {next === 'relocated' ? (
        <BoardField label={t('ficha.relocatedTo')}>
          <input
            className={fieldClass}
            value={relocatedTo}
            onChange={(e) => setRelocatedTo(e.target.value)}
          />
        </BoardField>
      ) : null}
      {flash ? <Flash tone="err">{flash}</Flash> : null}
      <BoardButton invert pending={pending} onClick={() => void apply()}>
        {t('ficha.setStatus')}
      </BoardButton>
    </Section>
  );
}

function PreviewSection({ id }: { id: string }) {
  const t = useTranslations('admin');
  const [q, setQ] = useState('');
  const [result, setResult] = useState<string | null>(null);

  return (
    <Section title={t('ficha.preview')}>
      <div className="flex gap-2">
        <input
          className={fieldClass}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('preview.query')}
        />
        <BoardButton
          invert
          onClick={async () => {
            if (!q.trim()) return;
            const data = await adminGet<{ appears: boolean; rank: number | null; total: number }>(
              `/api/admin/search-preview?q=${encodeURIComponent(q.trim())}&businessId=${id}`,
            );
            setResult(
              data.appears
                ? t('preview.rank', { rank: String(data.rank), total: String(data.total) })
                : t('preview.missing'),
            );
          }}
        >
          {t('preview.run')}
        </BoardButton>
      </div>
      {result ? <p className="text-sm">{result}</p> : null}
    </Section>
  );
}

export function EmptyFicha() {
  const t = useTranslations('admin.businesses');
  return (
    <div className="flex h-full flex-col justify-center px-8 text-muted">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase text-ink">
        {t('pick')}
      </h1>
      <p className="mt-3 max-w-sm">{t('pickHint')}</p>
    </div>
  );
}
