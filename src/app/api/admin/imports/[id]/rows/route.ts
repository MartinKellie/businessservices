import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { listImportRows, listImportRowsQuerySchema } from '@/lib/services/import-export';

const params = z.object({ id: z.string().uuid() });

export const GET = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin('owner');
    const { id } = params.parse(await ctx.params);
    const query = listImportRowsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json({ rows: await listImportRows(id, query) });
  },
);
