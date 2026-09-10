import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  addContactEntry,
  addContactEntrySchema,
  listContactHistory,
} from '@/lib/services/business-ops';

const params = z.object({ id: z.string().uuid() });

export const GET = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ contactHistory: await listContactHistory(id) });
  },
);

export const POST = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const entry = await addContactEntry(
      id,
      actor,
      addContactEntrySchema.parse(await request.json()),
    );
    return NextResponse.json({ entry }, { status: 201 });
  },
);
