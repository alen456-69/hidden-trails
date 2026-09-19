import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db, fail, sameOrigin } from '@/lib/server';
import { createSessionCookie } from '@/lib/auth';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request){
  try {
    sameOrigin(req);
    const body = schema.parse(await req.json());
    const d = db();
    const existing = await d.prepare('SELECT id FROM users WHERE email=?').bind(body.email).first();
    if (existing) throw Error('An account with that email already exists');
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(body.password, 10);
    const now = Date.now();
    await d.prepare('INSERT INTO users (id,email,password,name,created) VALUES (?,?,?,?,?)')
      .bind(id, body.email, hash, body.name, now).run();
    await createSessionCookie({ id, email: body.email, name: body.name });
    return Response.json({ ok: true, user: { id, name: body.name, email: body.email } });
  } catch (e) { return fail(e); }
}
