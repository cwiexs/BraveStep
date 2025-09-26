import type { NextApiRequest, NextApiResponse } from 'next';
import { compare } from 'bcryptjs';
import { signMobileToken } from '../../../lib/auth';

// Čia pakeisk į savo DB užklausą
async function getUserByEmail(email: string) {
  // Pvz.:
  // return await prisma.user.findUnique({ where: { email } });
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const user = await getUserByEmail(String(email).toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signMobileToken({ id: user.id, email: user.email });
    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'Internal error', detail: e?.message || String(e) });
  }
}
