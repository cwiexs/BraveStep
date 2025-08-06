import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Metodas neleidžiamas" });
  }

  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Nesate prisijungęs" });
    }

    const plans = await prisma.plan.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" }
    });

    return res.status(200).json({ plans });
  }

  // POST logika
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const oldPlans = await prisma.generatedPlan.findMany({
    where: {
      createdAt: { lt: sixMonthsAgo },
    },
  });

  for (const plan of oldPlans) {
    await prisma.archivedPlan.create({
      data: {
        userId: plan.userId,
        type: plan.type,
        originalPlan: plan.planData,
        modifiedPlan: plan.modifiedPlanData,
        feedback: plan.feedbackNotes,
        completionStatus: plan.completionStatus,
        createdAt: plan.createdAt,
        archivedAt: new Date(),
      },
    });

    await prisma.generatedPlan.delete({ where: { id: plan.id } });
  }

  return res.status(200).json({ message: `Perkelta: ${oldPlans.length} planų.` });
}
