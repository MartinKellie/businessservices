import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { createAdminUser, createAdminUserSchema, listAdminUsers } from '@/lib/services/admin-users';

export const GET = handle(async () => {
  await requireAdmin('owner');
  return NextResponse.json({ users: await listAdminUsers() });
});

export const POST = handle(async (request: NextRequest) => {
  await requireAdmin('owner');
  const input = createAdminUserSchema.parse(await request.json());
  const user = await createAdminUser(input);
  return NextResponse.json({ user }, { status: 201 });
});
