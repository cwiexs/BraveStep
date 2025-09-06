import NextAuth from "next-auth";
// Palik savo provider'ius; čia – pavyzdinis Credentials
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Normalizuoja vartotojo kalbos reikšmes į i18n kodą */
function normalizeLocale(value) {
  if (!value) return "en";
  const s = String(value).toLowerCase().trim();

  // Jei jau kodas – grąžiname kaip yra
  if (["lt", "en", "pl", "ru", "de"].includes(s)) return s;

  // Galimi pavadinimai / sinonimai
  if (s.includes("liet")) return "lt";                 // Lietuvių, lietuviskai, etc.
  if (s === "english" || s.includes("eng")) return "en";
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
        // ČIA pasilik savo tikrą autentifikaciją (password check ir t.t.)
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email || "" },
        });
        if (!user) return null;
        return { id: String(user.id), email: user.email };
      },
    }),
  ],
  callbacks: {
    /** Įrašo locale į JWT, paimdamas iš DB ir normalizuodamas į kodą */
    async jwt({ token, user }) {
      // Pirmo prisijungimo metu arba jei token dar neturi locale – paimam iš DB
      if (user || !token.locale) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user ? user.id : token.sub },
            select: { preferences: true, language: true }, // preferences.language arba legacy language
          });

          const rawLocale =
            dbUser?.preferences?.language ??
            dbUser?.language ??
            "en";

          token.locale = normalizeLocale(rawLocale);
        } catch {
          token.locale = token.locale || "en";
        }
      }
      return token;
    },

    /** Perkelia locale iš JWT į session (čia jį pasiims LocaleBootstrapper) */
    async session({ session, token }) {
      if (!session.user) session.user = {};
      session.user.id = token.sub;
      session.user.locale = token.locale || "en";
      return session;
    },
  },
};

export default NextAuth(authOptions);
