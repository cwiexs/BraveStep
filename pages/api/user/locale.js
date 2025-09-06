
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ ok: false, error: "not_authenticated" });

  const { locale } = req.body || {};
  if (!locale) return res.status(400).json({ ok: false, error: "missing_locale" });

  // Adjust if your schema places language elsewhere.
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { preferences: { set: { ...(session.user.preferences || {}), language: locale } } }
  });

  res.setHeader("Set-Cookie", `user_locale=${locale}; Path=/; SameSite=Lax`);
  return res.json({ ok: true, userId: user.id, locale });
}
