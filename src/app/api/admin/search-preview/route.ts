import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { search, searchPreview } from '@/lib/services/search';

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  businessId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
});

/**
 * Admin search-preview (scope §32). With `businessId`: reports whether that
 * business appears for `q` and at what rank. Without it: returns the ranked
 * result list so an editor can eyeball tagging quality before publishing.
 */
export const GET = handle(async (request: NextRequest) => {
  await requireAdmin();
  const { q, businessId, areaId } = querySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  if (businessId) {
    return NextResponse.json(await searchPreview(businessId, q, areaId));
  }

  const result = await search({ q, areaId, page: 1 });
  return NextResponse.json({
    total: result.total,
    resolved: result.resolved,
    results: result.results.map((r, i) => ({
      rank: i + 1,
      id: r.id,
      name: r.name,
      status: r.status,
      primaryCategory: r.primaryCategory?.name ?? null,
    })),
  });
});
