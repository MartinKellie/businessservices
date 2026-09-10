import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { completeFollowUp } from '@/lib/services/business-ops';

const params = z.object({ id: z.string().uuid() });

export const POST = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const followUp = await completeFollowUp(id, actor);
    return NextResponse.json({ followUp });
  },
);
