// /pages/api/complete-plan.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma'; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Užuot tikėjęsi, kad req.body jau JSON – patikrinam
  let data;
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { planId, difficultyRating, userComment } = data;

  if (!planId) {
    return res.status(400).json({ error: 'Missing planId' });
  }

  try {
    // Tikrinam, ar planas egzistuoja
    const existing = await prisma.generatedPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'GeneratedPlan not found' });
    }

    // Atnaujinam įrašą
await prisma.generatedPlan.update({
  where: { id: planId },
  data: {
    difficultyRating: difficultyRating ?? undefined,
    userComment: userComment ?? undefined,
    wasCompleted: true, 
  },
});

    return res.status(200).json({ message: 'Feedback saved successfully' });

  } catch (error) {
    console.error('[complete-plan] DB klaida:', error);
    return res.status(500).json({ error: 'Server error while saving feedback' });
  }
}
