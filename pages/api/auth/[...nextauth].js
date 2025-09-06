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

// ... viršuje kaip yra

export const authOptions = {
  providers: [ /* tavo providers */ ],
  callbacks: {
    async jwt({ token, user }) {
      if (user || !token.locale || !token.name) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user ? user.id : token.sub },
            select: { preferredLanguage: true, name: true }, // ← PRIDĖTA name
          });
          const raw = dbUser?.preferredLanguage ?? "en";
          token.locale = normalizeLocale(raw);
          if (dbUser?.name) token.name = dbUser.name;        // ← PRIDĖTA
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
      // ↓ PRIDĖTA: perduodam vardą į sesiją
      session.user.name = token.name || session.user.name || (session.user.email ? session.user.email.split('@')[0] : "Vartotojas");
      return session;
    }
  }
};

export default NextAuth(authOptions);
