import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { handle } from '@/lib/http';
import { assertNotInMaintenance } from '@/lib/maintenance';
import { getPublicBusiness } from '@/lib/services/public';

export const dynamic = 'force-dynamic';

const params = z.object({ id: z.string().trim().min(1).max(120) });

/** Public business detail — the expanded-card / bottom-sheet data (scope §6). */
export const GET = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await assertNotInMaintenance();
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ business: await getPublicBusiness(id) });
  },
);
