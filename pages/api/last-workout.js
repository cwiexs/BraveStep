import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(req, res) {
  console.log("🔍 /api/last-workout – užklausa startuota");

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      console.warn("⚠️ Nepavyko gauti sesijos arba vartotojo el. pašto");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("✅ Sesija gauta:", session.user.email);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.warn("⚠️ Vartotojas nerastas pagal el. paštą");
      return res.status(404).json({ error: "User not found" });
    }

    console.log("✅ Vartotojas rastas su ID:", user.id);

    const lastPlan = await prisma.generatedPlan.findFirst({
      where: {
        userId: user.id,

      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastPlan) {
      console.warn("ℹ️ Nebuvo rastas paskutinis planas");
      return res.status(200).json({ plan: null });
    }

    console.log("✅ Paskutinis planas rastas:", lastPlan.id);

return res.status(200).json({
  plan: {
    ...lastPlan.planData,
    id: lastPlan.id
  }
});


  } catch (err) {
    console.error("💥 Klaida /api/last-workout:", err);
    return res.status(500).json({ error: "Internal Server Error", details: String(err) });
  }
}
