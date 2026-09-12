import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  getBusiness,
  setBusinessProductsServices,
  setProductsSchema,
} from '@/lib/services/businesses';

const params = z.object({ id: z.string().uuid() });

export const PUT = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    await setBusinessProductsServices(id, setProductsSchema.parse(await request.json()));
    const business = await getBusiness(id);
    return NextResponse.json({ productsServices: business.productsServices });
  },
);
