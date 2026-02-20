import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no heavy dependencies).
 * Used by middleware — must NOT import bcryptjs, prisma, etc.
 */
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
};
