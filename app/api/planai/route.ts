import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const schema = z.object({
    age: z.number().min(10).max(99),
    goal: z.string().min(3),
    sport: z.string().min(3)
  });

  const data = schema.parse(body);

  const prompt = `Sukurk 4 savaičių treniruočių planą žmogui, kurio amžius ${data.age}, tikslas – ${data.goal}, sporto rūšis – ${data.sport}. Grąžink struktūrizuotai su savaitėmis ir dienomis.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }]
  });

  const plan = completion.choices[0].message.content ?? '';

  await prisma.plan.create({ data: { ...data, plan } });

  return NextResponse.json({ plan });
}