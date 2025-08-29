import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const plans = await prisma.generatedPlan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, planData: true, type: true },
    });
    return res.status(200).json({ plans });
  } catch (e) {
    console.error("[archive-plans][GET] error:", e);
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}
