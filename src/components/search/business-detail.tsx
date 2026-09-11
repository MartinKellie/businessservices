'use client';

import { AtSign, ExternalLink, Mail, Users } from 'lucide-react';
import type { PublicBusiness } from '@/lib/api-contract';
import { PublicApiError, fetchBusiness } from '@/lib/api-contract';
import {
  DAY_NAMES,
  facebookHref,
  formatHour,
  instagramHref,
  statusLabel,
  websiteHref,
} from '@/lib/public-format';
import { useEffect, useState } from 'react';

export function BusinessDetail({ businessId }: { businessId: string }) {
  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchBusiness(businessId)
      .then((row) => {
        if (cancelled) return;
        setBusiness(row);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setBusiness(null);
        setError(
          err instanceof PublicApiError ? err.message : 'No se pudieron cargar los detalles.',
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (loading) {
    return <p className="px-4 pb-4 text-sm text-muted">Cargando ficha…</p>;
  }
  if (error || !business) {
    return (
      <p className="px-4 pb-4 text-sm" role="alert">
        {error ?? 'No se encontró el negocio.'}
      </p>
    );
  }

  const extraStatus = statusLabel(business.status);
  const lastUpdated =
    business.lastUpdatedAt != null
      ? new Date(business.lastUpdatedAt).toLocaleDateString('es-CO')
      : null;

  return (
    <div className="space-y-3 border-t border-current/15 px-4 pb-5 pt-3 text-sm">
      {business.address ? <p>{business.address}</p> : null}
      {business.serviceAreaNote ? <p>Zona de servicio: {business.serviceAreaNote}</p> : null}
      {business.relocatedTo ? (
        <p>
          {extraStatus ?? 'Movido'} — ahora:{' '}
          <a href={`/buscar?q=${encodeURIComponent(business.relocatedTo.name)}`} className="underline">
            {business.relocatedTo.name}
          </a>
        </p>
      ) : extraStatus ? (
        <p>{extraStatus}</p>
      ) : null}

      {business.openingHours.length > 0 ? (
        <ul className="space-y-0.5">
          {business.openingHours.map((row, index) => (
            <li key={`${row.dayOfWeek}-${row.opensAt}-${index}`} className="flex justify-between gap-4">
              <span>{DAY_NAMES[row.dayOfWeek - 1] ?? `Día ${row.dayOfWeek}`}</span>
              <span className="tabular-nums">
                {formatHour(row.opensAt)}–{formatHour(row.closesAt)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {business.contact.email ? (
          <a href={`mailto:${business.contact.email}`} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
            <Mail size={14} strokeWidth={2} aria-hidden="true" />
            Correo
          </a>
        ) : null}
        {business.contact.website ? (
          <a
            href={websiteHref(business.contact.website)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
            Sitio
          </a>
        ) : null}
        {business.contact.instagram ? (
          <a
            href={instagramHref(business.contact.instagram)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            <AtSign size={14} strokeWidth={2} aria-hidden="true" />
            Instagram
          </a>
        ) : null}
        {business.contact.facebook ? (
          <a
            href={facebookHref(business.contact.facebook)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            <Users size={14} strokeWidth={2} aria-hidden="true" />
            Facebook
          </a>
        ) : null}
      </div>

      {business.photoUrls.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto">
          {business.photoUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="h-24 w-32 shrink-0 object-cover" />
          ))}
        </div>
      ) : null}

      {lastUpdated ? <p className="text-xs opacity-80">Última actualización: {lastUpdated}</p> : null}
    </div>
  );
}
