import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { HttpError } from '@/lib/http';

export const adminRoleSchema = z.enum(['owner', 'editor']);

export const createAdminUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).max(200).optional(),
  role: adminRoleSchema.default('editor'),
});

export const updateAdminUserSchema = z
  .object({
    name: z.string().trim().min(1).max(200).nullable(),
    role: adminRoleSchema,
    isActive: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'No hay cambios que aplicar.' });

export async function listAdminUsers() {
  return db.select().from(adminUsers).orderBy(asc(adminUsers.email));
}

export async function createAdminUser(input: z.infer<typeof createAdminUserSchema>) {
  const email = input.email.toLowerCase().trim();
  const existing = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email),
  });
  if (existing) {
    throw new HttpError(409, 'already_exists', 'Ya existe un usuario con ese correo.', {
      email: 'Este correo ya está registrado.',
    });
  }
  const [row] = await db
    .insert(adminUsers)
    .values({ email, name: input.name?.trim() || null, role: input.role })
    .returning();
  return row;
}

/** Number of active owners other than `exceptId`. */
async function otherActiveOwners(exceptId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminUsers)
    .where(
      and(eq(adminUsers.role, 'owner'), eq(adminUsers.isActive, true), ne(adminUsers.id, exceptId)),
    );
  return count;
}

export async function updateAdminUser(
  id: string,
  actingAdminId: string,
  input: z.infer<typeof updateAdminUserSchema>,
) {
  const target = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, id) });
  if (!target) throw new HttpError(404, 'not_found', 'Usuario no encontrado.');

  const nextRole = input.role ?? target.role;
  const nextActive = input.isActive ?? target.isActive;

  // Never allow the last active owner to lose owner access or be deactivated.
  const losingOwner = target.role === 'owner' && (nextRole !== 'owner' || !nextActive);
  if (losingOwner && (await otherActiveOwners(id)) === 0) {
    throw new HttpError(409, 'last_owner', 'Debe existir al menos un propietario activo.');
  }
  // Guard against self lock-out.
  if (id === actingAdminId && (nextRole !== 'owner' || !nextActive)) {
    throw new HttpError(409, 'self_lockout', 'No puede quitarse su propio acceso de propietario.');
  }

  const [row] = await db
    .update(adminUsers)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(adminUsers.id, id))
    .returning();
  return row;
}
