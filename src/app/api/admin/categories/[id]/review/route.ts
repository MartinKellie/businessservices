import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { reviewCategory, reviewSchema } from '@/lib/services/taxonomy';

const params = z.object({ id: z.string().uuid() });

export const POST = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin('owner');
    const { id } = params.parse(await ctx.params);
    const category = await reviewCategory(id, reviewSchema.parse(await request.json()), actor);
    return NextResponse.json({ category });
  },
);
