import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { updateAdminUser, updateAdminUserSchema } from '@/lib/services/admin-users';

const paramsSchema = z.object({ id: z.string().uuid() });

export const PATCH = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const acting = await requireAdmin('owner');
    const { id } = paramsSchema.parse(await ctx.params);
    const input = updateAdminUserSchema.parse(await request.json());
    const user = await updateAdminUser(id, acting.adminId, input);
    return NextResponse.json({ user });
  },
);
