import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { deleteCategory, updateCategory, updateCategorySchema } from '@/lib/services/taxonomy';

const params = z.object({ id: z.string().uuid() });

export const PATCH = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const category = await updateCategory(id, updateCategorySchema.parse(await request.json()));
    return NextResponse.json({ category });
  },
);

export const DELETE = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin('owner');
    const { id } = params.parse(await ctx.params);
    await deleteCategory(id);
    return new NextResponse(null, { status: 204 });
  },
);
