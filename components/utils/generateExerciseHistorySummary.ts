// components/utils/generateExerciseHistorySummary.ts

import { prisma } from '../../lib/prisma'

export async function generateExerciseHistorySummary(userId: string, daysBack = 10) {
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - daysBack)

  const history = await prisma.exerciseHistory.findMany({
    take: 50, // Max 50 įrašų
    where: {
      userId,
      workoutDate: {
        gte: fromDate,
      },
      plan: {
        wasCompleted: true, // Tik iš atliktų planų
      }
    },
    orderBy: {
      workoutDate: 'desc',
    },
    include: {
      plan: {
        select: {
          difficultyRating: true,
        }
      }
    }
  })

  const summary: Record<string, {
    name: string
    lastPerformed: Date
    timesPerformedLastWeek: number
    ratings: number[]
    notes: string[]
  }> = {}

  for (const item of history) {
    if (!summary[item.exerciseName]) {
      summary[item.exerciseName] = {
        name: item.exerciseName,
        lastPerformed: item.workoutDate,
        timesPerformedLastWeek: 0,
        ratings: [],
        notes: [],
      }
    }

    const ex = summary[item.exerciseName]
    ex.timesPerformedLastWeek++
    if (item.userRating) ex.ratings.push(item.userRating)
    if (item.comment) ex.notes.push(item.comment)

    if (item.workoutDate > ex.lastPerformed) {
      ex.lastPerformed = item.workoutDate
    }
  }

  return Object.values(summary).map((ex) => ({
    name: ex.name,
    lastPerformed: ex.lastPerformed.toISOString().split('T')[0],
    timesPerformedLastWeek: ex.timesPerformedLastWeek,
    averageRating: ex.ratings.length
      ? Math.round((ex.ratings.reduce((a, b) => a + b, 0) / ex.ratings.length) * 10) / 10
      : null,
    notes: ex.notes,
  }))
}
