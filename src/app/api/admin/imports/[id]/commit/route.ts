import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { commitImportBatch } from '@/lib/services/import-export';

const params = z.object({ id: z.string().uuid() });

/** Creates a draft business for every valid row (scope §31). Owner only. */
export const POST = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin('owner');
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ batch: await commitImportBatch(id, actor) });
  },
);
