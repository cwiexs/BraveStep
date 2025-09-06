import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeLocale(value) {
  if (!value) return null;
  const s = String(value).toLowerCase().trim();
  if (["lt","en","pl","ru","de"].includes(s)) return s;
  if (s.includes("liet")) return "lt";
  if (s.includes("eng")) return "en";
  if (s.startsWith("pl") || s.includes("pol")) return "pl";
  if (s.startsWith("ru") || s.includes("rus")) return "ru";
  if (s.startsWith("de") || s.includes("ger") || s.includes("deut")) return "de";
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ ok: false, error: "not_authenticated" });

  const desired = normalizeLocale(req.body?.locale);
  if (!desired) return res.status(400).json({ ok: false, error: "invalid_locale" });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { preferredLanguage: desired },
    select: { id: true, preferredLanguage: true }
  });

  // Padėk Next/i18next suprasti kalbą:
  res.setHeader("Set-Cookie", `user_locale=${desired}; Path=/; SameSite=Lax`);
  return res.json({ ok: true, userId: user.id, locale: user.preferredLanguage });
}
