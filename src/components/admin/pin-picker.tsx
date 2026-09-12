'use client';

import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CUCUTA_CENTER, FALLBACK_MAP_STYLE, mapStyleUrl } from '@/lib/map-style';

if (typeof window !== 'undefined') {
  maplibregl.setWorkerUrl('/vendor/maplibre-gl/maplibre-gl-worker.mjs');
}

export function PinPicker({
  lat,
  lng,
  onPick,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const startLat = lat;
    const startLng = lng;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyleUrl() ?? FALLBACK_MAP_STYLE,
      center: startLat != null && startLng != null ? [startLng, startLat] : CUCUTA_CENTER,
      zoom: startLat != null ? 15 : 12,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.on('click', (event) => {
      onPickRef.current(event.lngLat.lat, event.lngLat.lng);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once; pin updates live in the marker effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lat == null || lng == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'h-3 w-3 bg-ink';
      markerRef.current = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }
    map.easeTo({ center: [lng, lat], duration: 180 });
  }, [lat, lng]);

  return <div ref={containerRef} className="h-64 w-full border border-rail/40" />;
}
