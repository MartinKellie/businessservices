import { describe, expect, it, vi } from 'vitest';
import { searchAddress } from '@/lib/geocode';

function fakeNominatimResponse(rows: { display_name: string; lat: string; lon: string }[]) {
  return { ok: true, json: async () => rows } as Response;
}

describe('searchAddress', () => {
  it('normalises Nominatim rows and caches by query', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        fakeNominatimResponse([{ display_name: 'Centro, Cúcuta', lat: '7.8939', lon: '-72.5078' }]),
      );

    const first = await searchAddress('Centro, Cucuta', fetchImpl);
    expect(first).toEqual([{ label: 'Centro, Cúcuta', lat: 7.8939, lng: -72.5078 }]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    // Same query (case/whitespace-insensitive) is served from cache, not refetched.
    const second = await searchAddress('  centro, cucuta  ', fetchImpl);
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws a 502 HttpError when Nominatim is unavailable', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false } as Response);
    await expect(searchAddress('a distinct uncached query', fetchImpl)).rejects.toMatchObject({
      status: 502,
      code: 'geocode_unavailable',
    });
  });
});
