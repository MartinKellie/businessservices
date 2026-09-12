import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { setActivePremises, setPremisesSchema } from '@/lib/services/businesses';

const params = z.object({ id: z.string().uuid() });

export const PUT = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const premises = await setActivePremises(id, setPremisesSchema.parse(await request.json()));
    return NextResponse.json({ premises });
  },
);
