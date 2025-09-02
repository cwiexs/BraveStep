// pages/api/archive-plans.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

/**
 * GET  -> grąžina TIK prisijungusio vartotojo planus (naujausi viršuje)
 * POST -> archyvavimo/tvarkymo operacija:
 *         - su x-cron-secret == process.env.CRON_SECRET leidžia GLOBAL (visų) senų įrašų paiešką
 *         - be sekreto – TIK prisijungusio vartotojo senų įrašų paieška
 * Pastaba: čia tik pavyzdys, kuris grąžina skaičių; jei reikia trinti/žymėti „archived“,
 * pridėk atitinkamą logiką žemiau, išlaikant filtrą pagal userId.
 */

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.email) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Stabiliai gaunam DB userId pagal email
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
          completionStatus: true,
          userId: true,
          user: { select: { email: true } },
        },
      });

      return res.status(200).json({ plans });
    }

    if (req.method === "POST") {
      // CRON apsauga globaliam tvarkymui
      const allowGlobal =
        req.headers["x-cron-secret"] &&
        process.env.CRON_SECRET &&
        req.headers["x-cron-secret"] === process.env.CRON_SECRET;

      // Vienas bendras "senumo" skaičiavimas visam POST blokui
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      let oldPlans = [];

      if (allowGlobal) {
        // Globalus tvarkymas tik su teisingu sekretu
        oldPlans = await prisma.generatedPlan.findMany({
          where: { createdAt: { lt: sixMonthsAgo } },
          select: {
            id: true,
            userId: true,
            createdAt: true,
            planData: true,
            modifiedPlanData: true,
            feedbackNotes: true,
            completionStatus: true,
          },
        });
      } else {
        // Kitu atveju – tik prisijungusio vartotojo senesni kaip 6 mėn. planai
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

        oldPlans = await prisma.generatedPlan.findMany({
          where: { userId: dbUser.id, createdAt: { lt: sixMonthsAgo } },
          select: {
            id: true,
            userId: true,
            createdAt: true,
            planData: true,
            modifiedPlanData: true,
            feedbackNotes: true,
            completionStatus: true,
          },
        });
      }

      // Čia gali daryti realų archyvavimą/trynimą, jei reikia:
      // await prisma.generatedPlan.deleteMany({ where: { id: { in: oldPlans.map(p => p.id) } } });

      return res.status(200).json({
        ok: true,
        count: oldPlans.length,
        scope: allowGlobal ? "global" : "user",
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (err) {
    console.error("[archive-plans] error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
