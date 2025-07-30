import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

// Next.js API endpoint – pažymi planą kaip atliktą, įrašo įvertinimą ir komentarą
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Tik POST užklausos
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  // Gauti reikiamus duomenis iš kūno
  const { planId, difficultyRating, userComment } = req.body;
console.log("API gavo kūną:", req.body);
  // Patikrinti ar yra planId ir difficultyRating (optional, bet rekomenduojama)
  if (!planId) {
    return res.status(400).json({ error: 'Missing planId' });
  }

  try {
    // Atnaujinti planą: pažymėti kaip atliktą, įrašyti įvertinimą ir komentarą
    const updatedPlan = await prisma.generatedPlan.update({
      where: { id: planId },
      data: {
        wasCompleted: true,
        difficultyRating: difficultyRating ?? 3, // 3 kaip numatyta – balansas
        userComment: userComment ?? null,
      },
    });

    // Grąžinti naują plano būseną (arba tiesiog OK)
    return res.status(200).json(updatedPlan);
  } catch (error) {
    console.error("Nepavyko atnaujinti plano:", error);
    return res.status(500).json({ error: 'Error updating plan' });
  }
}
