// pages/api/complete-plan.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  let body: any;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { planId, difficultyRating, userComment, completionStatus } = body || {};
  if (!planId || typeof planId !== "string") return res.status(400).json({ error: "Missing planId" });

  try {
    const exists = await prisma.generatedPlan.findUnique({ where: { id: planId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: "Plan not found" });

    await prisma.generatedPlan.update({
      where: { id: planId },
      data: {
        wasCompleted: true, // <- pažymim kaip atliktą
        difficultyRating: typeof difficultyRating === "number" ? difficultyRating : undefined,
        userComment: typeof userComment === "string" ? userComment : undefined,
        completionStatus: completionStatus ?? { finishedAt: new Date().toISOString() },
      },
    });

    return res.status(200).json({ ok: true, message: "Feedback saved & plan marked completed" });
  } catch (e: any) {
    console.error("[complete-plan] error:", e);
    return res.status(500).json({ error: "Server error while saving feedback" });
  }
}
