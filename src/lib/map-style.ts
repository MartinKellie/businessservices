/**
 * MapLibre style: configured vector tiles, or a documented OSM raster fallback
 * when NEXT_PUBLIC_MAP_STYLE_URL is unset.
 */
export const FALLBACK_MAP_STYLE = {
  version: 8 as const,
  name: 'osm-raster-fallback',
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }],
};

export const CUCUTA_CENTER: [number, number] = [-72.5078, 7.8939];

export function mapStyleUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  return url && url.length > 0 ? url : undefined;
}
