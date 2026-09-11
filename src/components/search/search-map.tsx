'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SearchPin } from '@/lib/api-contract';
import { CUCUTA_CENTER, FALLBACK_MAP_STYLE, mapStyleUrl } from '@/lib/map-style';
import { usePublicCopy } from '@/lib/use-public-copy';

interface SearchMapProps {
  pins: SearchPin[];
  selectedId: string | null;
  onSelect: (businessId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  /** Result-card hover/focus, distinct from a click (`selectedId`) — paint only, no pan. */
  hoveredId?: string | null;
}

export function SearchMap({ pins, selectedId, onSelect, userLocation, hoveredId = null }: SearchMapProps) {
  const { copy } = usePublicCopy();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const pinsRef = useRef(pins);
  const selectedRef = useRef(selectedId);
  const hoveredRef = useRef(hoveredId);

  useEffect(() => {
    onSelectRef.current = onSelect;
    pinsRef.current = pins;
    selectedRef.current = selectedId;
    hoveredRef.current = hoveredId;
  }, [onSelect, pins, selectedId, hoveredId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyleUrl() ?? FALLBACK_MAP_STYLE,
      center: userLocation ? [userLocation.lng, userLocation.lat] : CUCUTA_CENTER,
      zoom: 12,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.on('load', () => {
      const ink = readToken('--ink', '#1a1812');
      const board = readToken('--board', '#f3ead4');
      const signal = readToken('--signal', '#0d6b38');
      const signalInk = readToken('--signal-ink', '#f4fff4');

      map.addSource('pins', {
        type: 'geojson',
        data: toCollection(pinsRef.current),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 48,
      });
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'pins',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ink,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 26],
          'circle-stroke-width': 2,
          'circle-stroke-color': board,
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'pins',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': board,
        },
      });
      map.addLayer({
        id: 'unclustered',
        type: 'circle',
        source: 'pins',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            [
              'any',
              ['==', ['get', 'id'], selectedRef.current ?? ''],
              ['==', ['get', 'id'], hoveredRef.current ?? ''],
            ],
            board,
            ink,
          ],
          'circle-radius': [
            'case',
            [
              'any',
              ['==', ['get', 'id'], selectedRef.current ?? ''],
              ['==', ['get', 'id'], hoveredRef.current ?? ''],
            ],
            10,
            7,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': [
            'case',
            [
              'any',
              ['==', ['get', 'id'], selectedRef.current ?? ''],
              ['==', ['get', 'id'], hoveredRef.current ?? ''],
            ],
            ink,
            board,
          ],
        },
      });
      map.addSource('user', {
        type: 'geojson',
        data: userPoint(userLocation),
      });
      map.addLayer({
        id: 'user-dot',
        type: 'circle',
        source: 'user',
        paint: {
          // Distinct from business pins (ink/board) so "you are here" never reads as a
          // result.
          'circle-color': signal,
          'circle-radius': 7,
          'circle-stroke-width': 3,
          'circle-stroke-color': signalInk,
        },
      });

      map.on('click', 'clusters', async (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const source = map.getSource('pins') as maplibregl.GeoJSONSource;
        if (!feature || !source) return;
        const clusterId = feature.properties?.cluster_id as number;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const geometry = feature.geometry;
        if (geometry.type !== 'Point') return;
        map.easeTo({ center: geometry.coordinates as [number, number], zoom });
      });
      map.on('click', 'unclustered', (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectRef.current(id);
      });
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseenter', 'unclustered', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseleave', 'unclustered', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Map is created once; pin and selection updates happen in later effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource('pins') as maplibregl.GeoJSONSource | undefined;
    source?.setData(toCollection(pins));
  }, [pins]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource('user') as maplibregl.GeoJSONSource | undefined;
    source?.setData(userPoint(userLocation ?? null));
    if (!map || !userLocation) return;

    // Zoom in close to the picked address/"Cerca de mí" location, widening only as far
    // as needed to also frame nearby result pins — a previous manual zoom-out otherwise
    // persists across a new location. `maxZoom` caps how close a single/no-pin case
    // zooms in, since a degenerate (point-only) bounds has no natural zoom limit.
    const bounds = new maplibregl.LngLatBounds(
      [userLocation.lng, userLocation.lat],
      [userLocation.lng, userLocation.lat],
    );
    for (const pin of pins) bounds.extend([pin.lng, pin.lat]);
    map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 600 });
  }, [userLocation, pins]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('unclustered')) return;
    const ink = readToken('--ink', '#1a1812');
    const board = readToken('--board', '#f3ead4');
    map.setPaintProperty('unclustered', 'circle-color', [
      'case',
      ['any', ['==', ['get', 'id'], selectedId ?? ''], ['==', ['get', 'id'], hoveredId ?? '']],
      board,
      ink,
    ]);
    map.setPaintProperty('unclustered', 'circle-radius', [
      'case',
      ['any', ['==', ['get', 'id'], selectedId ?? ''], ['==', ['get', 'id'], hoveredId ?? '']],
      10,
      7,
    ]);
    map.setPaintProperty('unclustered', 'circle-stroke-color', [
      'case',
      ['any', ['==', ['get', 'id'], selectedId ?? ''], ['==', ['get', 'id'], hoveredId ?? '']],
      ink,
      board,
    ]);
  }, [selectedId, hoveredId]);

  // Deliberately separate from the paint effect above: a card hover must never pan the
  // map (it'd be jarring while scrolling the list), only a click (selectedId) should.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pin = pins.find((item) => item.businessId === selectedId);
    if (pin) map.easeTo({ center: [pin.lng, pin.lat], padding: { bottom: 80 } });
  }, [selectedId, pins]);

  return (
    <div className="relative h-full min-h-72 w-full">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label={copy.mapLabel} />
      {mapStyleUrl() ? null : (
        <p className="pointer-events-none absolute bottom-8 left-2 bg-board/90 px-2 py-1 text-xs text-muted md:bottom-2">
          {copy.mapFallback}
        </p>
      )}
    </div>
  );
}

function readToken(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function toCollection(pins: SearchPin[]) {
  return {
    type: 'FeatureCollection' as const,
    features: pins.map((pin) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [pin.lng, pin.lat] },
      properties: { id: pin.businessId, name: pin.name },
    })),
  };
}

function userPoint(location: { lat: number; lng: number } | null | undefined) {
  return {
    type: 'FeatureCollection' as const,
    features: location
      ? [
          {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [location.lng, location.lat] },
            properties: {},
          },
        ]
      : [],
  };
}
