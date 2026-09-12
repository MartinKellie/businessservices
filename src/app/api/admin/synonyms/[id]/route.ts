import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { deleteSynonym } from '@/lib/services/taxonomy';

const params = z.object({ id: z.string().uuid() });

export const DELETE = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin('owner');
    const { id } = params.parse(await ctx.params);
    await deleteSynonym(id);
    return new NextResponse(null, { status: 204 });
  },
);
