import type { DefaultSession } from 'next-auth';
import type { AdminRole } from '@/lib/roles';

declare module 'next-auth' {
  interface Session {
    user: {
      adminId?: string;
      role?: AdminRole;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    adminId?: string;
    role?: AdminRole;
  }
}
