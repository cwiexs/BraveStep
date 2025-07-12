// pages/api/archive-plans.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Tik POST metodas leidžiamas' });
  }

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
