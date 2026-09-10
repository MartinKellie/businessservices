import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { deleteMedia } from '@/lib/services/media';

const params = z.object({ id: z.string().uuid() });

export const DELETE = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    await deleteMedia(id);
    return new NextResponse(null, { status: 204 });
  },
);
