import { prisma } from '../../lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

// use singleton prisma from lib/prisma


export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Metodas neleidžiamas" });
  }

  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: "Nesate prisijungęs" });
    }

    // Resolve user by email to get stable DB id
    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, email: true } });
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    const plans = await prisma.generatedPlan.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        planData: true,
        modifiedPlanData: true,
        feedbackNotes: true,
        completionStatus: true,
        userId: true,
        user: { select: { email: true } },
      }
    });

    return res.status(200).json({ plans });
  }

  // POST logika archyvavimui
  // Protection: only allow global housekeeping if request has correct secret
  const allowGlobal = req.headers["x-cron-secret"] && process.env.CRON_SECRET && req.headers["x-cron-secret"] === process.env.CRON_SECRET;
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  let oldPlans = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  if (allowGlobal) {
    oldPlans = await prisma.generatedPlan.findMany({
      where: { createdAt: { lt: sixMonthsAgo } },
      select: { id: true, userId: true, planData: true, modifiedPlanData: true, feedbackNotes: true, completionStatus: true, createdAt: true },
    });
  } else {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) return res.status(401).json({ message: "Nesate prisijungęs" });
    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!dbUser) return res.status(404).json({ message: "User not found" });
    oldPlans = await prisma.generatedPlan.findMany({
      where: { userId: dbUser.id, createdAt: { lt: sixMonthsAgo } },
      select: { id: true, userId: true, planData: true, modifiedPlanData: true, feedbackNotes: true, completionStatus: true, createdAt: true },
    });
  }
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
