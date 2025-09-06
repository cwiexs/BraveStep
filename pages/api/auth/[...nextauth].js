
import NextAuth from "next-auth";
// Replace/extend with your real providers:
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({ where: { email: credentials?.email || "" } });
        if (!user) return null;
        return { id: String(user.id), email: user.email };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign in or if token lacks locale, read from DB
      if (user || !token.locale) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user ? user.id : token.sub },
            select: { preferences: true, language: true }
          });
          const locale =
            dbUser?.preferences?.language ||
            dbUser?.language || // legacy flat field
            "en";
          token.locale = locale;
        } catch (e) {
          token.locale = token.locale || "en";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) session.user = {};
      session.user.id = token.sub;
      session.user.locale = token.locale || "en";
      return session;
    }
  }
};

export default NextAuth(authOptions);
