// components/utils/generateExerciseHistorySummary.ts
import { prisma } from "../../lib/prisma";

type SummaryRow = {
  name: string;
  lastPerformed: Date;
  timesPerformedLastWeek: number;
  ratings: number[];
  notes: string[];
};

/**
 * Sugeneruoja santrauką tik iš atliktų planų (plan.wasCompleted = true).
 * Jei reikia visų – išmesk `plan: { is: { wasCompleted: true } }` iš where.
 */
export async function generateExerciseHistorySummary(userId: string, daysBack = 10) {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);

  const history = await prisma.exerciseHistory.findMany({
    take: 50,
    where: {
      userId,
      workoutDate: { gte: fromDate },
      // svarbu: teisinga relacijos filtro forma
      plan: { is: { wasCompleted: true } },
    },
    orderBy: { workoutDate: "desc" },
    select: {
      workoutDate: true,
      exerciseName: true,
      userRating: true,
      comment: true,
      plan: { select: { difficultyRating: true } },
    },
  });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const summary: Record<string, SummaryRow> = {};

  for (const item of history) {
    const key = item.exerciseName?.trim() || "Nežinomas pratimas";
    if (!summary[key]) {
      summary[key] = {
        name: key,
        lastPerformed: item.workoutDate,
        timesPerformedLastWeek: 0,
        ratings: [],
        notes: [],
      };
    }

    const row = summary[key];
    if (item.workoutDate >= weekAgo) row.timesPerformedLastWeek += 1;

    const ratingFromPlan = (item.plan as any)?.difficultyRating as number | null | undefined;
    const rating = typeof ratingFromPlan === "number" ? ratingFromPlan : item.userRating;
    if (typeof rating === "number") row.ratings.push(rating);

    if (item.comment && item.comment.trim()) row.notes.push(item.comment.trim());

    if (item.workoutDate > row.lastPerformed) row.lastPerformed = item.workoutDate;
  }

  return Object.values(summary).map((ex) => ({
    name: ex.name,
    lastPerformed: ex.lastPerformed.toISOString().split("T")[0],
    timesPerformedLastWeek: ex.timesPerformedLastWeek,
    averageRating: ex.ratings.length
      ? Math.round((ex.ratings.reduce((a, b) => a + b, 0) / ex.ratings.length) * 10) / 10
      : null,
    notes: ex.notes.slice(0, 3),
  }));
}
