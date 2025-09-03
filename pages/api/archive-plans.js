// pages/api/archive-plans.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

/**
 * GET  → grąžina TIK prisijungusio vartotojo planus (naujausi viršuje)
 * POST → pavyzdinis senų planų skaičiavimas/archyvavimo vieta (optional)
 *
 * Pastaba: čia pateikiame TIK reikalingus laukus front-endui,
 * ypač svarbu – `wasCompleted: Boolean`.
 */
export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Gausime userId stabiliai pagal el. paštą
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const plans = await prisma.generatedPlan.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          planData: true,
          modifiedPlanData: true,
          feedbackNotes: true,
          // 🔑 svarbiausia eilutė frontui:
          wasCompleted: true,
          // Jei norėsi rodyti papildomą būseną (pvz., dienų lygmenį) – paliekam ir šį lauką
          completionStatus: true,
          userId: true,
          user: { select: { email: true } },
        },
      });

      return res.status(200).json({ plans });
    }

    if (req.method === "POST") {
      // (Pasirinktinai) paprastas pavyzdys, kaip suskaičiuoti senus planus archyvavimui
      // Jei reikia realiai trinti/žymėti – pridėk operaciją žemiau.

      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const oldPlans = await prisma.generatedPlan.findMany({
        where: { userId: dbUser.id, createdAt: { lt: sixMonthsAgo } },
        select: { id: true },
      });

      // Pvz. jeigu norėtum pažymėti archived = true (jei toks laukas būtų schemoje):
      // await prisma.generatedPlan.updateMany({
      //   where: { id: { in: oldPlans.map(p => p.id) } },
      //   data: { archived: true },
      // });

      return res.status(200).json({ ok: true, count: oldPlans.length });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (err) {
    console.error("[archive-plans] error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
