import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { UserRole } from "@/lib/types/auth";

function getAllowedUsers(): Record<string, UserRole> {
  try {
    return JSON.parse(process.env.BBK_ALLOWED_EMAILS_JSON || "{}") as Record<string, UserRole>;
  } catch {
    return {};
  }
}

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      return Boolean(getAllowedUsers()[email]);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const role = getAllowedUsers()[user.email.toLowerCase()];
        if (role) token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
