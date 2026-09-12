import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  createProductService,
  createProductServiceSchema,
  listProductsServices,
  taxonomyListQuerySchema,
} from '@/lib/services/taxonomy';

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin();
  const query = taxonomyListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json({ productsServices: await listProductsServices(query) });
});

export const POST = handle(async (request: NextRequest) => {
  const actor = await requireAdmin();
  const input = createProductServiceSchema.parse(await request.json());
  const productService = await createProductService(input, actor);
  return NextResponse.json({ productService }, { status: 201 });
});
