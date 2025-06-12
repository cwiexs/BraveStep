import { NextRequest, NextResponse } from 'next/server';

export function requireAuth(req: NextRequest) {
  const pwd = req.headers.get('x-api-key');
  if (pwd !== process.env.API_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}