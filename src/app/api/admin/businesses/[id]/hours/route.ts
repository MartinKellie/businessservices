import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  getOpeningHours,
  setOpeningHours,
  setOpeningHoursSchema,
} from '@/lib/services/opening-hours';

const params = z.object({ id: z.string().uuid() });

export const GET = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ openingHours: await getOpeningHours(id) });
  },
);

export const PUT = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const openingHours = await setOpeningHours(
      id,
      setOpeningHoursSchema.parse(await request.json()),
    );
    return NextResponse.json({ openingHours });
  },
);
