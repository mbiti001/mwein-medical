import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '../../../lib/auth';

export async function GET(req: NextRequest) {
  const cookiesStore = cookies();
  const sessionToken = cookiesStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionToken || !verifyAdminSessionToken(sessionToken)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const donations = await prisma.donation.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: { payment: true }
  });
  return Response.json(donations);
}