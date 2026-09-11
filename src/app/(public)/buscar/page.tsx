import { SearchScreen } from '@/components/search/search-screen';
import { parseSearchParams, type SearchResult } from '@/lib/api-contract';
import { HttpError } from '@/lib/http';
import { listActiveAreas, listPublicCategories } from '@/lib/services/public';
import { search } from '@/lib/services/search';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const geo = raw.geo;
  const locationDenied = (Array.isArray(geo) ? geo[0] : geo) === 'denied';
  const initialQuery = parseSearchParams(raw);

  const [areas, categories, initial] = await Promise.all([
    listActiveAreas(),
    listPublicCategories(),
    loadSearch(initialQuery),
  ]);

  return (
    <SearchScreen
      initialQuery={initialQuery}
      initialResult={initial.result}
      initialError={initial.error}
      areas={areas}
      categories={categories}
      locationDenied={locationDenied}
    />
  );
}

async function loadSearch(query: ReturnType<typeof parseSearchParams>): Promise<{
  result: SearchResult | null;
  error: string | null;
}> {
  try {
    return { result: await search({ ...query, page: query.page ?? 1 }), error: null };
  } catch (err) {
    if (err instanceof HttpError) return { result: null, error: err.message };
    return { result: null, error: 'No se pudieron cargar los resultados.' };
  }
}
