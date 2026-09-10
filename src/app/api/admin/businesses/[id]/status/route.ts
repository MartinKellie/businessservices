import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { changeStatus, changeStatusSchema, publishReadiness } from '@/lib/services/business-status';

const params = z.object({ id: z.string().uuid() });

/** Publish-readiness report for the editor UI. */
export const GET = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const problems = await publishReadiness(id);
    return NextResponse.json({ publishable: problems.length === 0, problems });
  },
);

export const POST = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const business = await changeStatus(id, changeStatusSchema.parse(await request.json()), actor);
    return NextResponse.json({ business });
  },
);
