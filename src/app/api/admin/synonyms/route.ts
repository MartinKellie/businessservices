import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import {
  createSynonym,
  createSynonymSchema,
  listSynonyms,
  taxonomyListQuerySchema,
} from '@/lib/services/taxonomy';

export const GET = handle(async (request: NextRequest) => {
  await requireAdmin();
  const query = taxonomyListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return NextResponse.json({ synonyms: await listSynonyms(query) });
});

export const POST = handle(async (request: NextRequest) => {
  const actor = await requireAdmin();
  const input = createSynonymSchema.parse(await request.json());
  const synonym = await createSynonym(input, actor);
  return NextResponse.json({ synonym }, { status: 201 });
});
