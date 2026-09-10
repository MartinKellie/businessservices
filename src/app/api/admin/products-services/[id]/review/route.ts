import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { reviewProductService, reviewSchema } from '@/lib/services/taxonomy';

const params = z.object({ id: z.string().uuid() });

export const POST = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin('owner');
    const { id } = params.parse(await ctx.params);
    const productService = await reviewProductService(
      id,
      reviewSchema.parse(await request.json()),
      actor,
    );
    return NextResponse.json({ productService });
  },
);
