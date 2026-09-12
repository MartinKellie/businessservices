import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  clearFollowUp,
  getOpenFollowUp,
  setFollowUp,
  setFollowUpSchema,
} from '@/lib/services/business-ops';

const params = z.object({ id: z.string().uuid() });

export const GET = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ followUp: (await getOpenFollowUp(id)) ?? null });
  },
);

export const PUT = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const followUp = await setFollowUp(id, actor, setFollowUpSchema.parse(await request.json()));
    return NextResponse.json({ followUp });
  },
);

export const DELETE = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    await clearFollowUp(id);
    return new NextResponse(null, { status: 204 });
  },
);
