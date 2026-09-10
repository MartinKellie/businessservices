import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { getBusiness, updateBusiness, updateBusinessSchema } from '@/lib/services/businesses';

const params = z.object({ id: z.string().uuid() });

export const GET = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ business: await getBusiness(id) });
  },
);

export const PATCH = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const business = await updateBusiness(
      id,
      updateBusinessSchema.parse(await request.json()),
      actor,
    );
    return NextResponse.json({ business });
  },
);
