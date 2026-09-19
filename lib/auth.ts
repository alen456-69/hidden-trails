import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export type SessionUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
};

const COOKIE = 'ht_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function isAdminEmail(email: string){
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

function secret(){
  const s = process.env.AUTH_SECRET;
  if(!s) throw Error('Server is not configured (missing AUTH_SECRET)');
  return new TextEncoder().encode(s);
}

export async function createSessionCookie(payload: { id: string; email: string; name: string }){
  const token = await new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now()/1000) + MAX_AGE)
    .sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(){
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if(!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const userId = payload.sub as string;
    const email = payload.email as string;
    const name = (payload.name as string) || email;
    if(!userId || !email) return null;
    return { userId, displayName: name, email, fullName: name, isAdmin: isAdminEmail(email) };
  } catch {
    return null;
  }
}
