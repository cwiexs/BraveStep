import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return res.status(404).json({ error: "User not found" });

  const lastPlan = await prisma.generatedPlan.findFirst({
    where: { userId: user.id, type: "sport" },
    orderBy: { createdAt: "desc" },
  });

  if (!lastPlan) return res.status(200).json({ plan: null });

res.status(200).json({ plan: lastPlan ? lastPlan.planData : null });

}
