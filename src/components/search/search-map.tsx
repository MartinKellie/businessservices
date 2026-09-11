'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SearchPin } from '@/lib/api-contract';
import { CUCUTA_CENTER, FALLBACK_MAP_STYLE, mapStyleUrl } from '@/lib/map-style';

interface SearchMapProps {
  pins: SearchPin[];
  selectedId: string | null;
  onSelect: (businessId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export function SearchMap({ pins, selectedId, onSelect, userLocation }: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const pinsRef = useRef(pins);
  const selectedRef = useRef(selectedId);

  useEffect(() => {
    onSelectRef.current = onSelect;
    pinsRef.current = pins;
    selectedRef.current = selectedId;
  }, [onSelect, pins, selectedId]);

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
        id: 'unclustered',
        type: 'circle',
        source: 'pins',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['case', ['==', ['get', 'id'], selectedRef.current ?? ''], board, ink],
          'circle-radius': ['case', ['==', ['get', 'id'], selectedRef.current ?? ''], 10, 7],
          'circle-stroke-width': 2,
          'circle-stroke-color': ['case', ['==', ['get', 'id'], selectedRef.current ?? ''], ink, board],
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
    if (!map?.getLayer('unclustered')) return;
    const ink = readToken('--ink', '#1a1812');
    const board = readToken('--board', '#f3ead4');
    map.setPaintProperty('unclustered', 'circle-color', [
      'case',
      ['==', ['get', 'id'], selectedId ?? ''],
      board,
      ink,
    ]);
    map.setPaintProperty('unclustered', 'circle-radius', [
      'case',
      ['==', ['get', 'id'], selectedId ?? ''],
      10,
      7,
    ]);
    map.setPaintProperty('unclustered', 'circle-stroke-color', [
      'case',
      ['==', ['get', 'id'], selectedId ?? ''],
      ink,
      board,
    ]);
    const pin = pins.find((item) => item.businessId === selectedId);
    if (pin) map.easeTo({ center: [pin.lng, pin.lat], padding: { bottom: 80 } });
  }, [selectedId, pins]);

  return (
    <div className="relative h-full min-h-72 w-full">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label="Mapa de resultados" />
      {mapStyleUrl() ? null : (
        <p className="pointer-events-none absolute bottom-2 left-2 bg-board/90 px-2 py-1 text-xs text-muted">
          Mapa de referencia — configura NEXT_PUBLIC_MAP_STYLE_URL para teselas vectoriales.
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
