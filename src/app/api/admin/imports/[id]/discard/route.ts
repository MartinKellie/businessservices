import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { discardImportBatch } from '@/lib/services/import-export';

const params = z.object({ id: z.string().uuid() });

export const POST = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin('owner');
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ batch: await discardImportBatch(id) });
  },
);
