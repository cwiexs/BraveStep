import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const lastPlan = await prisma.generatedPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const totalWorkouts = await prisma.generatedPlan.count({
      where: { userId: user.id },
    });

    // Jei neturi logikos laikui ir kalorijoms, paliekam 0
    const totalTime = 0;
    const calories = 0;

    return res.status(200).json({
      stats: {
        totalWorkouts,
        totalTime,
        calories
      },
      plan: lastPlan
        ? { ...lastPlan.planData, id: lastPlan.id, createdAt: lastPlan.createdAt }
        : null
    });

  } catch (err) {
    console.error("💥 Klaida /api/last-workout:", err);
    return res.status(500).json({ error: "Internal Server Error", details: String(err) });
  }
}
