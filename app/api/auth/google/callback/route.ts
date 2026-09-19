import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/server';
import { createSessionCookie } from '@/lib/auth';

const STATE_COOKIE = 'ht_oauth_state';

function fail(origin: string, message: string){
  return Response.redirect(`${origin}/?auth_error=${encodeURIComponent(message)}`, 302);
}

export async function GET(req: Request){
  const url = new URL(req.url);
  const origin = url.origin;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail(origin, 'Google sign-in is not configured.');

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  if (!code) return fail(origin, 'Google sign-in was cancelled or failed.');

  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);
  if (!expectedState || expectedState !== returnedState) {
    return fail(origin, 'Your sign-in request expired. Please try again.');
  }

  try {
    // Exchange the authorization code for an access/ID token.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail(origin, 'Could not verify your Google account.');
    const tokenData: any = await tokenRes.json();

    // Fetch the person's Google profile.
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!profileRes.ok) return fail(origin, 'Could not read your Google profile.');
    const profile: any = await profileRes.json();

    const googleId: string = profile.sub;
    const email: string = (profile.email || '').toLowerCase();
    const name: string = profile.name || email || 'Explorer';
    if (!googleId || !email) return fail(origin, 'Google did not share an email address.');
    if (profile.email_verified === false) return fail(origin, 'Please use a verified Google email.');

    const d = db();

    // 1. Already linked — sign them straight in.
    let user = await d.prepare('SELECT id,email,name,banned FROM users WHERE google_id=?')
      .bind(googleId).first<{ id: string; email: string; name: string; banned: number }>();

    // 2. Not linked yet, but an account with this email already exists (e.g. they
    //    originally signed up with a password) — link Google to that account.
    if (!user) {
      const existing = await d.prepare('SELECT id,email,name,banned FROM users WHERE email=?')
        .bind(email).first<{ id: string; email: string; name: string; banned: number }>();
      if (existing) {
        await d.prepare('UPDATE users SET google_id=? WHERE id=?').bind(googleId, existing.id).run();
        user = existing;
      }
    }

    // 3. Brand new person — create an account. They'll never use the password
    //    field, so it's filled with an unusable random hash.
    if (!user) {
      const id = crypto.randomUUID();
      const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);
      await d.prepare('INSERT INTO users (id,email,password,name,created,google_id) VALUES (?,?,?,?,?,?)')
        .bind(id, email, randomPassword, name, Date.now(), googleId).run();
      user = { id, email, name, banned: 0 };
    }

    if (user.banned) return fail(origin, 'This account has been suspended.');

    await createSessionCookie({ id: user.id, email: user.email, name: user.name });
    return Response.redirect(`${origin}/`, 302);
  } catch (e) {
    console.error(e);
    return fail(origin, 'Something went wrong signing in with Google.');
  }
}
