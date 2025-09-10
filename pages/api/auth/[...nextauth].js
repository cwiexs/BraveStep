import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

// Prisma singleton (saugu Vercel/serverless aplinkoje)
const prisma = globalThis._prisma || new PrismaClient();
if (!globalThis._prisma) globalThis._prisma = prisma;

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
        // TODO: čia įsidėk tikrą password check
        const email = credentials?.email || "";
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        return { id: String(user.id), email: user.email }; // id -> string, kad JWT turėtų sub
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Pirmąkart prisijungus arba jei trūksta laukų – pasikeliam iš DB
      if (user || !token.locale || !token.name) {
        try {
          // Jei tavo User.id yra INT – konvertuok:
          // const whereId = user ? Number(user.id) : Number(token.sub);
          // Jei UUID/string – tiesiog:
          const whereId = user ? user.id : token.sub;

          const dbUser = await prisma.user.findUnique({
            where: { id: whereId },
            select: { preferredLanguage: true, name: true },
          });

          token.locale = normalizeLocale(dbUser?.preferredLanguage ?? "en");
          if (dbUser?.name) token.name = dbUser.name;
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
      session.user.name = token.name || session.user.name || (session.user.email ? session.user.email.split("@")[0] : "Vartotojas");
      return session;
    },
  },
};

export default NextAuth(authOptions);
