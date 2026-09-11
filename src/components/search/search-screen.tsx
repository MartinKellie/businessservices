'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { List, Map as MapIcon, Navigation, PanelLeftClose, PanelRightClose } from 'lucide-react';
import { BusinessDetail } from '@/components/search/business-detail';
import { ResultCard } from '@/components/search/result-card';
import type { PublicArea, PublicCategory, SearchQuery, SearchResult } from '@/lib/api-contract';
import { PublicApiError, fetchSearch, searchQueryToParams } from '@/lib/api-contract';
import { PREF, type DesktopPane, type MobileView } from '@/lib/preferences';
import { usePreference } from '@/lib/use-preference';

const SearchMap = dynamic(() => import('@/components/search/search-map').then((mod) => mod.SearchMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted">Cargando mapa…</div>,
});

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
  const [storedSplit, setStoredSplit] = usePreference(PREF.desktopSplit);
  const [storedPane, setStoredPane] = usePreference(PREF.desktopPane);
  const [storedMobile, setStoredMobile] = usePreference(PREF.mobileView);
  const [storedAreaSlug, setStoredAreaSlug] = usePreference(PREF.area);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [geoDenied, setGeoDenied] = useState(Boolean(locationDenied));
  const listRef = useRef<HTMLDivElement>(null);
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
          setError('No se pudieron cargar los resultados.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, fetchedKey]);

  function selectBusiness(id: string, from: 'list' | 'map') {
    setSelectedId(id);
    if (from === 'map') setSheetOpen(true);
    const node = document.getElementById(`result-${id}`);
    node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function setDesktopPane(next: DesktopPane) {
    setStoredPane(next);
  }

  function setMobile(next: MobileView) {
    setStoredMobile(next);
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

  const area = areas.find((item) => item.id === effectiveQuery.areaId);
  const category = categories.find((item) => item.id === effectiveQuery.categoryId);
  const usingNearMe = effectiveQuery.lat != null && effectiveQuery.lng != null;
  const contextLabel = usingNearMe
    ? `Cerca de ti${result?.appliedRadiusMeters ? ` (${Math.round(result.appliedRadiusMeters / 1000)} km)` : ''}`
    : area?.name ?? 'Todas las zonas';

  const listPane = (
    <div ref={listRef} className="board-scroll h-full overflow-y-auto">
      {loading ? <p className="px-4 py-8 text-muted">Buscando…</p> : null}
      {error ? (
        <p className="px-4 py-8" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && result && result.results.length === 0 ? (
        <div className="px-4 py-10">
          <p className="font-display text-3xl font-extrabold uppercase">Nada en el tablero</p>
          <p className="mt-3 text-muted">
            Prueba con otras palabras, otra zona, o quita un filtro. El buscador entiende nombres,
            oficios y cómo se dice por aquí.
          </p>
        </div>
      ) : null}
      {result?.results.map((card) => (
        <ResultCard
          key={card.id}
          card={card}
          selected={selectedId === card.id}
          onSelect={() => selectBusiness(card.id, 'list')}
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
    <div className="relative h-full min-h-72">
      <SearchMap
        pins={result?.pins ?? []}
        selectedId={selectedId}
        onSelect={(id) => selectBusiness(id, 'map')}
        userLocation={
          usingNearMe && effectiveQuery.lat != null && effectiveQuery.lng != null
            ? { lat: effectiveQuery.lat, lng: effectiveQuery.lng }
            : null
        }
      />
      {sheetOpen && selectedId && mobileView === 'map' ? (
        <div className="absolute inset-x-0 bottom-0 max-h-[70%] overflow-y-auto border-t-2 border-ink bg-board shadow-[0_-8px_24px_rgb(0_0_0_/_0.18)] md:hidden">
          <button
            type="button"
            className="w-full py-2 text-xs uppercase tracking-wide text-muted"
            onClick={() => setSheetOpen(false)}
          >
            Cerrar ficha
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
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col md:h-[calc(100dvh-8.25rem)]">
      <div className="shrink-0 border-b border-rail/25 px-4 py-3 sm:px-6">
        <form
          className="flex flex-col gap-3 lg:flex-row lg:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            replaceQuery({ ...query, q: draftQ.trim() || undefined, page: 1 });
          }}
        >
          <label className="letter-track min-w-0 flex-1 border-b-2 border-rail pb-1">
            <span className="sr-only">Qué estás buscando</span>
            <input
              value={draftQ}
              onChange={(event) => setDraftQ(event.target.value)}
              className="font-display w-full bg-transparent text-2xl font-bold uppercase tracking-wide"
              placeholder="¿Qué estás buscando?"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              value={effectiveQuery.areaId ?? ''}
              onChange={(event) => {
                const areaId = event.target.value || undefined;
                const slug = areas.find((item) => item.id === areaId)?.slug;
                if (slug) setStoredAreaSlug(slug);
                replaceQuery({ ...query, areaId, lat: undefined, lng: undefined, page: 1 });
              }}
              className="border border-rail/40 bg-board px-2 py-2"
              aria-label="Zona"
            >
              <option value="">Todas las zonas</option>
              {areas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => requestNearMe(replaceQuery, query, setGeoDenied)}
              className={`inline-flex items-center gap-1.5 border px-3 py-2 text-sm ${
                usingNearMe ? 'bg-ink text-board' : 'border-rail/40'
              }`}
            >
              <Navigation size={16} strokeWidth={2} aria-hidden="true" />
              Cerca de mí
            </button>
            <button type="submit" className="bg-ink px-4 py-2 font-display font-extrabold uppercase text-board">
              Buscar
            </button>
          </div>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Filtros">
          <FilterChip
            active={Boolean(query.openNow)}
            onClick={() => replaceQuery({ ...query, openNow: !query.openNow, page: 1 })}
          >
            Abierto ahora
          </FilterChip>
          <FilterChip
            active={Boolean(query.whatsapp)}
            onClick={() => replaceQuery({ ...query, whatsapp: !query.whatsapp, page: 1 })}
          >
            WhatsApp
          </FilterChip>
          <label className="sr-only" htmlFor="category-filter">
            Categoría
          </label>
          <select
            id="category-filter"
            value={query.categoryId ?? ''}
            onChange={(event) =>
              replaceQuery({ ...query, categoryId: event.target.value || undefined, page: 1 })
            }
            className={`border px-2 py-1.5 text-sm ${query.categoryId ? 'bg-ink text-board' : 'border-rail/40 bg-board'}`}
          >
            <option value="">Todas las categorías</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted">
            {contextLabel}
            {category ? ` · ${category.name}` : ''}
            {result ? ` · ${result.total} ${result.total === 1 ? 'resultado' : 'resultados'}` : ''}
          </p>
        </div>

        {geoDenied && !usingNearMe ? (
          <p className="mt-2 text-sm text-warn" role="status">
            No se pudo usar tu ubicación. Mostrando {area?.name ?? 'la zona seleccionada'}.
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between md:hidden">
          <div className="flex border border-rail/40">
            <button
              type="button"
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm ${mobileView === 'map' ? 'bg-ink text-board' : ''}`}
              onClick={() => setMobile('map')}
            >
              <MapIcon size={16} strokeWidth={2} aria-hidden="true" />
              Mapa
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm ${mobileView === 'list' ? 'bg-ink text-board' : ''}`}
              onClick={() => setMobile('list')}
            >
              <List size={16} strokeWidth={2} aria-hidden="true" />
              Lista
            </button>
          </div>
        </div>
        <div className="mt-3 hidden items-center gap-2 md:flex">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
            onClick={() => setDesktopPane(pane === 'map' ? 'none' : 'list')}
          >
            <PanelRightClose size={16} strokeWidth={2} aria-hidden="true" />
            {pane === 'map' ? 'Mostrar lista' : 'Ocultar mapa'}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
            onClick={() => setDesktopPane(pane === 'list' ? 'none' : 'map')}
          >
            <PanelLeftClose size={16} strokeWidth={2} aria-hidden="true" />
            {pane === 'list' ? 'Mostrar mapa' : 'Ocultar lista'}
          </button>
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
            aria-label="Ajustar divisor"
            tabIndex={0}
            className="w-2 shrink-0 cursor-col-resize bg-rail/30 hover:bg-signal"
            onPointerDown={onDividerPointerDown}
            onPointerMove={onDividerPointerMove}
            onPointerUp={onDividerPointerUp}
          />
        ) : null}
        <div style={{ width: mapWidth }} className={pane === 'list' ? 'hidden' : 'min-w-0'}>
          {mapPane}
        </div>
      </div>
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
      className={`border px-3 py-1.5 text-sm ${active ? 'bg-ink text-board' : 'border-rail/40'}`}
    >
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
  return (
    <div className="flex items-center justify-between px-4 py-4 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="underline-offset-4 hover:underline disabled:opacity-40"
      >
        Anterior
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
        Siguiente
      </button>
    </div>
  );
}

function requestNearMe(
  replaceQuery: (next: SearchQuery) => void,
  query: SearchQuery,
  setGeoDenied: (value: boolean) => void,
) {
  if (!navigator.geolocation) {
    setGeoDenied(true);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
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
      setGeoDenied(true);
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
  );
}
