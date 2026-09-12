import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { reviewMedia, reviewMediaSchema } from '@/lib/services/media';

const params = z.object({ id: z.string().uuid() });

export const POST = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const media = await reviewMedia(id, reviewMediaSchema.parse(await request.json()), actor);
    return NextResponse.json({ media });
  },
);
