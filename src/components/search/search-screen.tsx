'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { List, Map as MapIcon, Navigation } from 'lucide-react';
import { GeocodeField } from '@/components/public/geocode-field';
import { BusinessDetail } from '@/components/search/business-detail';
import { ResultCard } from '@/components/search/result-card';
import type { PublicArea, PublicCategory, SearchQuery, SearchResult } from '@/lib/api-contract';
import { PublicApiError, fetchSearch, searchQueryToParams } from '@/lib/api-contract';
import { fill } from '@/lib/public-copy';
import { PREF, type DesktopPane, type MobileView } from '@/lib/preferences';
import { usePreference } from '@/lib/use-preference';
import { usePublicCopy } from '@/lib/use-public-copy';

function MapLoading() {
  const { copy } = usePublicCopy();
  return (
    <div className="grid h-full min-h-72 place-items-center border-ink/20 bg-board text-sm text-muted md:border-l-2">
      {copy.loadingMap}
    </div>
  );
}

const SearchMap = dynamic(
  () => import('@/components/search/search-map').then((mod) => mod.SearchMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

interface SearchScreenProps {
  initialQuery: SearchQuery;
  initialResult: SearchResult | null;
  initialError: string | null;
  areas: PublicArea[];
  categories: PublicCategory[];
  locationDenied?: boolean;
}

function queryKeyOf(value: SearchQuery): string {
  return JSON.stringify(value);
}

export function SearchScreen({
  initialQuery,
  initialResult,
  initialError,
  areas,
  categories,
  locationDenied,
}: SearchScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [draftQ, setDraftQ] = useState(initialQuery.q ?? '');
  const [result, setResult] = useState<SearchResult | null>(initialResult);
  const [error, setError] = useState<string | null>(initialError);
  const [fetchedKey, setFetchedKey] = useState(queryKeyOf(initialQuery));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [storedSplit, setStoredSplit] = usePreference(PREF.desktopSplit);
  const [storedPane, setStoredPane] = usePreference(PREF.desktopPane);
  const [storedMobile, setStoredMobile] = usePreference(PREF.mobileView);
  const [storedAreaSlug, setStoredAreaSlug] = usePreference(PREF.area);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [geoDenied, setGeoDenied] = useState(Boolean(locationDenied));
  const [geoAsking, setGeoAsking] = useState(false);
  const { copy } = usePublicCopy();
  const dragging = useRef(false);

  const split = (() => {
    const raw = Number(storedSplit);
    return Number.isFinite(raw) && raw >= 28 && raw <= 72 ? raw : 46;
  })();
  const pane: DesktopPane =
    storedPane === 'map' || storedPane === 'list' || storedPane === 'none' ? storedPane : 'none';
  const mobileView: MobileView = storedMobile === 'list' ? 'list' : 'map';
  const storedArea = areas.find((item) => item.slug === storedAreaSlug);
  const effectiveQuery: SearchQuery =
    query.areaId || query.lat != null ? query : { ...query, areaId: storedArea?.id };
  const queryKey = queryKeyOf(effectiveQuery);
  const loading = fetchedKey !== queryKey;

  const replaceQuery = useCallback(
    (next: SearchQuery) => {
      setQuery(next);
      const params = searchQueryToParams(next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (queryKey === fetchedKey) return;
    let cancelled = false;
    const nextQuery = JSON.parse(queryKey) as SearchQuery;
    fetchSearch(nextQuery)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setError(null);
        setFetchedKey(queryKey);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setResult(null);
        setFetchedKey(queryKey);
        if (err instanceof PublicApiError) {
          setError(err.message);
        } else {
          setError(copy.loadResults);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, fetchedKey, copy.loadResults]);

  function selectBusiness(id: string, from: 'list' | 'map') {
    setSelectedId(id);
    if (from === 'map') setSheetOpen(true);
    const node = document.getElementById(`result-${id}`);
    node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function onDividerPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDividerPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const parent = event.currentTarget.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(72, Math.max(28, next));
    setStoredSplit(String(Math.round(clamped)));
  }

  function onDividerPointerUp() {
    dragging.current = false;
  }

  function onDividerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setStoredSplit(String(Math.max(28, split - 2)));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setStoredSplit(String(Math.min(72, split + 2)));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setStoredSplit('28');
    } else if (event.key === 'End') {
      event.preventDefault();
      setStoredSplit('72');
    }
  }

  const area = areas.find((item) => item.id === effectiveQuery.areaId);
  const category = categories.find((item) => item.id === effectiveQuery.categoryId);
  const usingNearMe = effectiveQuery.lat != null && effectiveQuery.lng != null;
  // Memoised by value: SearchMap's camera effect keys off this reference, and a new
  // object every render (from an inline literal) would re-trigger it on any unrelated
  // re-render (filter toggle, card select, divider drag) while in near-me mode.
  const userLocation = useMemo(
    () =>
      usingNearMe && effectiveQuery.lat != null && effectiveQuery.lng != null
        ? { lat: effectiveQuery.lat, lng: effectiveQuery.lng }
        : null,
    [usingNearMe, effectiveQuery.lat, effectiveQuery.lng],
  );
  const contextLabel = usingNearMe
    ? `${copy.nearYou}${result?.appliedRadiusMeters ? ` (${Math.round(result.appliedRadiusMeters / 1000)} km)` : ''}`
    : (area?.name ?? copy.allAreas);

  const listPane = (
    <div className="board-scroll h-full overflow-y-auto">
      {loading ? <ResultSkeleton /> : null}
      {error ? (
        <p className="px-4 py-8" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && result && result.results.length === 0 ? (
        <div className="px-4 py-10">
          <p className="font-display text-3xl font-extrabold uppercase">{copy.emptyBoard}</p>
          <p className="mt-3 max-w-prose text-muted">{copy.emptyBoardHint}</p>
        </div>
      ) : null}
      {result?.results.map((card) => (
        <ResultCard
          key={card.id}
          card={card}
          selected={selectedId === card.id}
          onSelect={() => selectBusiness(card.id, 'list')}
          onHoverChange={(hovering) =>
            setHoveredId((prev) => (hovering ? card.id : prev === card.id ? null : prev))
          }
        >
          {selectedId === card.id ? <BusinessDetail key={card.id} businessId={card.id} /> : null}
        </ResultCard>
      ))}
      {result && result.total > result.pageSize ? (
        <Pagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          onPage={(page) => replaceQuery({ ...query, page })}
        />
      ) : null}
    </div>
  );

  const mapPane = (
    <div className="relative h-full min-h-72 md:border-l-2 md:border-ink">
      <SearchMap
        pins={result?.pins ?? []}
        selectedId={selectedId}
        hoveredId={hoveredId}
        onSelect={(id) => selectBusiness(id, 'map')}
        userLocation={userLocation}
      />
      {sheetOpen && selectedId && mobileView === 'map' ? (
        <div className="absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto border-t-2 border-ink bg-board shadow-[0_-8px_24px_rgb(0_0_0_/_0.18)] md:hidden">
          <button
            type="button"
            className="flex w-full flex-col items-center pt-2 pb-1 text-xs uppercase tracking-wide text-muted"
            onClick={() => setSheetOpen(false)}
          >
            <span className="mb-2 h-1 w-10 bg-rail/50" aria-hidden="true" />
            {copy.closeSheet}
          </button>
          {result?.results
            .filter((card) => card.id === selectedId)
            .map((card) => (
              <ResultCard key={card.id} card={card} selected onSelect={() => setSheetOpen(false)}>
                <BusinessDetail key={card.id} businessId={card.id} />
              </ResultCard>
            ))}
        </div>
      ) : null}
    </div>
  );

  const listWidth = pane === 'map' ? '0%' : pane === 'list' ? '100%' : `${split}%`;
  const mapWidth = pane === 'list' ? '0%' : pane === 'map' ? '100%' : `${100 - split}%`;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-rail/25 px-4 py-3 sm:px-6">
        <form
          className="flex flex-col gap-3 md:flex-row md:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            replaceQuery({ ...query, q: draftQ.trim() || undefined, page: 1 });
          }}
        >
          <label className="letter-track min-w-0 flex-1 border-b-2 border-rail pb-1">
            <span className="sr-only">{copy.whatLooking}</span>
            <input
              value={draftQ}
              onChange={(event) => setDraftQ(event.target.value)}
              className="font-display w-full bg-transparent text-2xl font-bold tracking-wide sm:text-3xl"
              placeholder={copy.whatLooking}
            />
          </label>
          <button
            type="submit"
            className="bg-ink px-5 py-2 font-display text-lg font-extrabold uppercase tracking-wide text-board hover:bg-signal hover:text-signal-ink"
          >
            {copy.search}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-stretch gap-2">
          <div className="flex w-full min-w-0 basis-full border border-rail/40 sm:max-w-md sm:basis-auto">
            <select
              value={effectiveQuery.areaId ?? ''}
              onChange={(event) => {
                const areaId = event.target.value || undefined;
                const slug = areas.find((item) => item.id === areaId)?.slug;
                if (slug) setStoredAreaSlug(slug);
                replaceQuery({ ...query, areaId, lat: undefined, lng: undefined, page: 1 });
              }}
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm"
              aria-label={copy.area}
            >
              <option value="">{copy.allAreas}</option>
              {areas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => requestNearMe(replaceQuery, query, setGeoDenied, setGeoAsking)}
              disabled={geoAsking}
              aria-pressed={usingNearMe}
              className={`inline-flex shrink-0 items-center gap-1.5 border-l px-3 py-2 text-sm ${
                usingNearMe ? 'bg-ink text-board' : 'border-rail/40 hover:bg-ink hover:text-board'
              }`}
            >
              <Navigation size={16} strokeWidth={2} aria-hidden="true" />
              {geoAsking ? copy.locatingShort : copy.nearMe}
            </button>
          </div>
          <div className="min-w-0 basis-full sm:max-w-md sm:basis-auto">
            <GeocodeField
              compact
              onPick={(hit) => {
                setGeoDenied(false);
                replaceQuery({
                  ...query,
                  lat: hit.lat,
                  lng: hit.lng,
                  areaId: undefined,
                  page: 1,
                });
              }}
            />
          </div>
          <FilterChip
            active={Boolean(query.openNow)}
            onClick={() => replaceQuery({ ...query, openNow: !query.openNow, page: 1 })}
          >
            {copy.openNow}
          </FilterChip>
          <FilterChip
            active={Boolean(query.whatsapp)}
            onClick={() => replaceQuery({ ...query, whatsapp: !query.whatsapp, page: 1 })}
          >
            WhatsApp
          </FilterChip>
          <label className="sr-only" htmlFor="category-filter">
            {copy.category}
          </label>
          <select
            id="category-filter"
            value={query.categoryId ?? ''}
            onChange={(event) =>
              replaceQuery({ ...query, categoryId: event.target.value || undefined, page: 1 })
            }
            className={`border px-3 py-2 text-sm ${query.categoryId ? 'border-ink bg-ink text-board' : 'border-rail/40 bg-board'}`}
          >
            <option value="">{copy.allCategories}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <p className="self-center text-sm text-muted">
            {contextLabel}
            {category ? ` · ${category.name}` : ''}
            {result
              ? ` · ${result.total} ${result.total === 1 ? copy.resultOne : copy.resultMany}`
              : ''}
          </p>
        </div>

        {geoDenied && !usingNearMe ? (
          <p className="mt-2 text-sm text-warn" role="status">
            {fill(copy.geoDeniedSearch, { area: area?.name ?? copy.selectedAreaFallback })}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex border border-rail/40 md:hidden">
            <PaneClip
              active={mobileView === 'map'}
              onClick={() => setStoredMobile('map')}
              icon={<MapIcon size={16} strokeWidth={2} aria-hidden="true" />}
            >
              {copy.map}
            </PaneClip>
            <PaneClip
              active={mobileView === 'list'}
              onClick={() => setStoredMobile('list')}
              icon={<List size={16} strokeWidth={2} aria-hidden="true" />}
            >
              {copy.list}
            </PaneClip>
          </div>
          <div
            className="hidden border border-rail/40 md:flex"
            role="group"
            aria-label={copy.panes}
          >
            <PaneClip active={pane === 'list'} onClick={() => setStoredPane('list')}>
              {copy.list}
            </PaneClip>
            <PaneClip active={pane === 'none'} onClick={() => setStoredPane('none')}>
              {copy.both}
            </PaneClip>
            <PaneClip active={pane === 'map'} onClick={() => setStoredPane('map')}>
              {copy.map}
            </PaneClip>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 md:hidden">{mobileView === 'list' ? listPane : mapPane}</div>

      <div className="hidden min-h-0 flex-1 md:flex">
        <div style={{ width: listWidth }} className={pane === 'map' ? 'hidden' : 'min-w-0'}>
          {listPane}
        </div>
        {pane === 'none' ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={copy.split}
            aria-valuemin={28}
            aria-valuemax={72}
            aria-valuenow={split}
            tabIndex={0}
            className="group relative w-3 shrink-0 cursor-col-resize touch-none"
            onPointerDown={onDividerPointerDown}
            onPointerMove={onDividerPointerMove}
            onPointerUp={onDividerPointerUp}
            onKeyDown={onDividerKeyDown}
          >
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-rail/50 group-hover:bg-signal group-focus-visible:bg-signal" />
          </div>
        ) : null}
        <div style={{ width: mapWidth }} className={pane === 'list' ? 'hidden' : 'min-w-0'}>
          {mapPane}
        </div>
      </div>
    </div>
  );
}

function ResultSkeleton() {
  const { copy } = usePublicCopy();
  return (
    <div className="px-4 py-2" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex items-center gap-3 border-b border-rail/15 py-4">
          <span className="menu-skeleton size-10 shrink-0" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="menu-skeleton block h-4 w-2/3" />
            <span className="menu-skeleton block h-3 w-1/3" />
          </span>
        </div>
      ))}
      <p className="sr-only">{copy.searching}</p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3 py-2 text-sm ${
        active ? 'border-ink bg-ink text-board' : 'border-rail/40 hover:bg-ink hover:text-board'
      }`}
    >
      {children}
    </button>
  );
}

function PaneClip({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm ${
        active ? 'bg-ink text-board' : 'hover:bg-ink hover:text-board'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  const { copy } = usePublicCopy();
  return (
    <div className="flex items-center justify-between px-4 py-4 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="underline-offset-4 hover:underline disabled:opacity-40"
      >
        {copy.previous}
      </button>
      <p className="tabular-nums">
        {page} / {pages}
      </p>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="underline-offset-4 hover:underline disabled:opacity-40"
      >
        {copy.next}
      </button>
    </div>
  );
}

function requestNearMe(
  replaceQuery: (next: SearchQuery) => void,
  query: SearchQuery,
  setGeoDenied: (value: boolean) => void,
  setGeoAsking: (value: boolean) => void,
) {
  if (!navigator.geolocation) {
    setGeoDenied(true);
    return;
  }
  setGeoAsking(true);
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setGeoAsking(false);
      setGeoDenied(false);
      replaceQuery({
        ...query,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        areaId: undefined,
        page: 1,
      });
    },
    () => {
      setGeoAsking(false);
      setGeoDenied(true);
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
  );
}
