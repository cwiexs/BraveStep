import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Stabilu prod'e: pagal email -> gaunam user.id
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const lastPlan = await prisma.generatedPlan.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        type: true,
        planData: true,
        wasCompleted: true,
        difficultyRating: true,
        userComment: true,
        completionStatus: true,
      },
    });

    const totalWorkouts = await prisma.generatedPlan.count({
      where: { userId: user.id },
    });

    // Jei nevedi laiko/kalorijų – paliekam 0
    const stats = {
      totalWorkouts,
      totalTime: 0,
      calories: 0,
    };

    // planData turi būti JSON; jeigu ne objektas – apgaubiam
    const plan =
      lastPlan
        ? {
            id: lastPlan.id,
            createdAt: lastPlan.createdAt,
            type: lastPlan.type,
            wasCompleted: lastPlan.wasCompleted ?? false,
            difficultyRating: lastPlan.difficultyRating ?? null,
            userComment: lastPlan.userComment ?? null,
            completionStatus: lastPlan.completionStatus ?? null,
            data: typeof lastPlan.planData === "object" && lastPlan.planData !== null
              ? lastPlan.planData
              : { value: lastPlan.planData },
          }
        : null;

    return res.status(200).json({ stats, plan });
  } catch (err) {
    console.error("💥 /api/last-workout error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: String(err) });
  }
}
