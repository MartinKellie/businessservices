import { adminRole } from '@/db/schema';

export type AdminRole = (typeof adminRole.enumValues)[number];

/** Owner implies every editor capability. */
export function hasRole(userRole: AdminRole, required: AdminRole): boolean {
  if (userRole === 'owner') return true;
  return userRole === required;
}
