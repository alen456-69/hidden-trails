import { getSessionUser, type SessionUser } from '@/lib/auth';

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !user.isAdmin) throw Object.assign(new Error('Not authorized'), { status: 403 });
  return user;
}
