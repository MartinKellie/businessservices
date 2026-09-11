import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { exportBusinesses, exportBusinessesQuerySchema } from '@/lib/services/import-export';

/** CSV/Excel export of businesses (scope §31). Owner only. */
export const GET = handle(async (request: NextRequest) => {
  await requireAdmin('owner');
  const query = exportBusinessesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const { buffer, contentType, filename } = await exportBusinesses(query);
  const body = typeof buffer === 'string' ? buffer : new Uint8Array(buffer);
  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
});
