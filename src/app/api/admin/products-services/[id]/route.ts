import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  deleteProductService,
  updateProductService,
  updateProductServiceSchema,
} from '@/lib/services/taxonomy';

const params = z.object({ id: z.string().uuid() });

export const PATCH = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const productService = await updateProductService(
      id,
      updateProductServiceSchema.parse(await request.json()),
    );
    return NextResponse.json({ productService });
  },
);

export const DELETE = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin('owner');
    const { id } = params.parse(await ctx.params);
    await deleteProductService(id);
    return new NextResponse(null, { status: 204 });
  },
);
