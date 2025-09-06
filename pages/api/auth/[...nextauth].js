import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeLocale(value) {
  if (!value) return "en";
  const s = String(value).toLowerCase().trim();
  if (["lt","en","pl","ru","de"].includes(s)) return s;
  if (s.includes("liet")) return "lt";
  if (s.includes("eng")) return "en";
  if (s.startsWith("pl") || s.includes("pol")) return "pl";
  if (s.startsWith("ru") || s.includes("rus")) return "ru";
  if (s.startsWith("de") || s.includes("ger") || s.includes("deut")) return "de";
  return "en";
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email || "" },
        });
        if (!user) return null;
        return { id: String(user.id), email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user || !token.locale) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user ? user.id : token.sub },
            select: { preferredLanguage: true },
          });
          const raw = dbUser?.preferredLanguage ?? "en";
          token.locale = normalizeLocale(raw);
        } catch {
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
    },
  },
};

export default NextAuth(authOptions);
