import NextAuth from 'next-auth';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { authConfig } from '@/auth.config';
import type { AdminRole } from '@/lib/roles';

/**
 * Full Auth.js setup (Node runtime — has database access).
 *
 * `admin_users` IS the access allow-list: sign-in only succeeds for an active
 * row whose email matches the Google account (case-insensitively). Sessions are
 * JWT-based, so no adapter/session tables are needed.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.email, email),
      });
      if (!admin || !admin.isActive) return false;

      await db
        .update(adminUsers)
        .set({
          lastLoginAt: sql`now()`,
          name: admin.name ?? user.name ?? null,
          image: user.image ?? admin.image ?? null,
        })
        .where(eq(adminUsers.id, admin.id));

      return true;
    },
    async jwt({ token, user }) {
      // On sign-in, resolve the admin record onto the token.
      if (user?.email) {
        const admin = await db.query.adminUsers.findFirst({
          where: eq(adminUsers.email, user.email.toLowerCase().trim()),
          columns: { id: true, role: true },
        });
        if (admin) {
          token.adminId = admin.id;
          token.role = admin.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.adminId) session.user.adminId = token.adminId as string;
      if (token.role) session.user.role = token.role as AdminRole;
      return session;
    },
  },
});
