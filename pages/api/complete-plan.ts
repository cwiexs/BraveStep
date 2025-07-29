// /pages/api/complete-plan.ts
import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { planId, difficultyRating, userComment } = req.body

  if (!planId) {
    return res.status(400).json({ error: 'Missing planId' })
  }

  try {
    await prisma.generatedPlan.update({
      where: { id: planId },
      data: {
        wasCompleted: true,
        difficultyRating: difficultyRating || 3, // jei nepasirinko – laikom 3
        userComment: userComment || '',
      },
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Klaida įrašant plano užbaigimą:', error)
    return res.status(500).json({ error: 'Vidinė serverio klaida' })
  }
}
