'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { PublicArea } from '@/lib/api-contract';
import { searchQueryToParams } from '@/lib/api-contract';
import { GeocodeField } from '@/components/public/geocode-field';
import { fill } from '@/lib/public-copy';
import { PREF } from '@/lib/preferences';
import { usePreference } from '@/lib/use-preference';
import { usePublicCopy } from '@/lib/use-public-copy';

export function HomeSearch({ areas }: { areas: PublicArea[] }) {
  const { copy } = usePublicCopy();
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
      <label
        htmlFor="home-q"
        className="font-display block text-4xl font-extrabold uppercase leading-none tracking-wide sm:text-6xl md:text-7xl"
      >
        {copy.whatLooking}
      </label>
      <div className="letter-track mt-8 border-b-2 border-rail pb-2">
        <input
          id="home-q"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          autoComplete="off"
          className="font-display w-full bg-transparent text-2xl font-semibold tracking-wide placeholder:font-sans placeholder:text-lg placeholder:font-normal placeholder:tracking-normal sm:text-4xl"
        />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex min-w-0 flex-1 border border-rail/40">
          <label className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5">
            <MapPin size={18} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">{copy.area}</span>
            <select
              value={areaSlug}
              onChange={(event) => setStoredSlug(event.target.value)}
              className="w-full min-w-0 border-0 bg-transparent text-base"
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
            className={`inline-flex shrink-0 items-center justify-center gap-2 border-l px-4 py-2.5 font-semibold ${
              geoState === 'denied'
                ? 'border-warn bg-warn text-warn-ink'
                : 'border-rail/40 hover:bg-ink hover:text-board'
            }`}
          >
            <Navigation size={18} strokeWidth={2} aria-hidden="true" />
            {geoState === 'asking' ? copy.locating : copy.nearMe}
          </button>
        </div>
        <button
          type="submit"
          className="bg-ink px-8 py-2.5 font-display text-lg font-extrabold uppercase tracking-wide text-board hover:bg-signal hover:text-signal-ink"
        >
          {copy.search}
        </button>
      </div>
      <GeocodeField
        onPick={(hit) => {
          setGeoState('idle');
          goToSearch({ lat: hit.lat, lng: hit.lng });
        }}
      />
      {geoState === 'denied' ? (
        <p className="mt-3 text-sm text-warn" role="status">
          {fill(copy.geoDeniedHome, {
            area: selectedArea()?.name ?? copy.selectedAreaFallback,
          })}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">{copy.geoHint}</p>
      )}
    </form>
  );
}
