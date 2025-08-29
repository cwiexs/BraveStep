import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  if (req.method === "GET") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session || !session.user?.email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Stabilu prod'e: pagal email -> user.id
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!user) return res.status(404).json({ message: "User not found" });

      const plans = await prisma.generatedPlan.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          type: true,
          wasCompleted: true,
          difficultyRating: true,
          userComment: true,
          completionStatus: true,
          planData: true,
        },
      });

      return res.status(200).json({ plans });
    } catch (e) {
      console.error("💥 /api/archive-plans [GET] error:", e);
      return res.status(500).json({ message: "Server error", details: String(e) });
    }
  }

  // POST: ankstesnė versija rėmėsi modeliu ArchivedPlan ir laukais,
  // kurių projekte / DB nėra. Grąžiname 501, kad buildas būtų stabilus.
  return res.status(501).json({
    message:
      "Archyvavimo API laikinai išjungtas. Jei nori archyvuoti, pasakyk – pridėsiu DB modelį ir saugią migraciją.",
  });
}
