import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { verifyBearerToken } from '../../lib/auth';
import { authOptions } from './auth/[...nextauth]';

// Čia pakeisk į savo DB užklausą
async function getUserById(id: string) {
  // Pvz.:
  // return await prisma.user.findUnique({ where: { id } });
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Bandome NextAuth sesiją (web)
  const session = await getServerSession(req, res, authOptions as any);
  if (session?.user?.email) {
    return res.status(200).json({
      name: session.user.name || '',
      email: session.user.email,
      id: (session as any).user?.id || null,
      source: 'nextauth-session'
    });
  }

  // 2) Bandome JWT (mobile)
  const decoded = verifyBearerToken(req.headers.authorization);
  if (decoded?.id) {
    const user = await getUserById(decoded.id);
    return res.status(200).json({
      id: decoded.id,
      email: decoded.email,
      name: user?.name || '',
      source: 'mobile-jwt'
    });
  }

  return res.status(401).json({ error: 'Unauthorized' });
}
