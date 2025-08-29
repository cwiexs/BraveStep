import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const count = await prisma.generatedPlan.count();
    const sample = await prisma.generatedPlan.findFirst({
      select: { id: true, createdAt: true, userId: true },
      orderBy: { createdAt: "desc" },
    });
    const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
    const info = {
      host: url?.hostname ?? "n/a",
      db: url ? url.pathname.replace("/", "") : "n/a",
    };
    res.status(200).json({ ok: true, count, sample, info });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
