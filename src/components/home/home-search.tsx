'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { PublicArea } from '@/lib/api-contract';
import { searchQueryToParams } from '@/lib/api-contract';
import { PREF } from '@/lib/preferences';
import { usePreference } from '@/lib/use-preference';

export function HomeSearch({ areas }: { areas: PublicArea[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [storedSlug, setStoredSlug] = usePreference(PREF.area);
  const [geoState, setGeoState] = useState<'idle' | 'asking' | 'denied'>('idle');
  const areaSlug =
    storedSlug && areas.some((area) => area.slug === storedSlug)
      ? storedSlug
      : (areas[0]?.slug ?? '');

  function selectedArea() {
    return areas.find((area) => area.slug === areaSlug) ?? areas[0];
  }

  function goToSearch(extra: { lat?: number; lng?: number } = {}) {
    const area = selectedArea();
    const params = searchQueryToParams({
      q: query.trim() || undefined,
      areaId: extra.lat == null ? area?.id : undefined,
      lat: extra.lat,
      lng: extra.lng,
    });
    router.push(`/buscar?${params.toString()}`);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    goToSearch();
  }

  function nearMe() {
    if (!navigator.geolocation) {
      setGeoState('denied');
      goToSearch();
      return;
    }
    setGeoState('asking');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState('idle');
        goToSearch({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setGeoState('denied');
        goToSearch();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-3xl">
      <label htmlFor="home-q" className="font-display block text-4xl font-extrabold uppercase leading-none tracking-wide sm:text-6xl md:text-7xl">
        ¿Qué estás buscando?
      </label>
      <div className="letter-track mt-8 border-b-2 border-rail pb-2">
        <input
          id="home-q"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Dispensador de agua, panadería, taller…"
          autoComplete="off"
          className="font-display w-full bg-transparent text-2xl font-semibold tracking-wide placeholder:font-sans placeholder:text-lg placeholder:font-normal placeholder:tracking-normal sm:text-4xl"
        />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <label className="flex min-w-0 flex-1 items-center gap-2 border border-rail/40 bg-board px-3 py-2.5">
          <MapPin size={18} strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">Zona</span>
          <select
            value={areaSlug}
            onChange={(event) => setStoredSlug(event.target.value)}
            className="w-full bg-transparent text-base"
          >
            {areas.map((area) => (
              <option key={area.id} value={area.slug}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={nearMe}
          disabled={geoState === 'asking'}
          className={`inline-flex items-center justify-center gap-2 border px-4 py-2.5 font-semibold ${
            geoState === 'denied'
              ? 'border-warn bg-warn text-warn-ink'
              : 'border-rail/40 hover:bg-ink hover:text-board'
          }`}
        >
          <Navigation size={18} strokeWidth={2} aria-hidden="true" />
          {geoState === 'asking' ? 'Obteniendo ubicación…' : 'Cerca de mí'}
        </button>
        <button
          type="submit"
          className="bg-ink px-6 py-2.5 font-display text-lg font-extrabold uppercase tracking-wide text-board hover:bg-signal hover:text-signal-ink"
        >
          Buscar
        </button>
      </div>
      {geoState === 'denied' ? (
        <p className="mt-3 text-sm text-warn" role="status">
          No se pudo usar tu ubicación. Se usará {selectedArea()?.name ?? 'la zona seleccionada'}.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">Elige tu barrio o usa tu ubicación. Sin cuenta.</p>
      )}
    </form>
  );
}
