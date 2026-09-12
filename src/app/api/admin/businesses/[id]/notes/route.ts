import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { addNote, addNoteSchema, listNotes } from '@/lib/services/business-ops';

const params = z.object({ id: z.string().uuid() });

export const GET = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ notes: await listNotes(id) });
  },
);

export const POST = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const note = await addNote(id, actor, addNoteSchema.parse(await request.json()));
    return NextResponse.json({ note }, { status: 201 });
  },
);
