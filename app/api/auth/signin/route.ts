import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db, fail, sameOrigin } from '@/lib/server';
import { createSessionCookie } from '@/lib/auth';

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request){
  try {
    sameOrigin(req);
    const body = schema.parse(await req.json());
    const d = db();
    const user = await d.prepare('SELECT id,email,password,name,banned FROM users WHERE email=?').bind(body.email).first<{id:string;email:string;password:string;name:string;banned:number}>();
    if (!user) throw Error('Incorrect email or password');
    const ok = await bcrypt.compare(body.password, user.password);
    if (!ok) throw Error('Incorrect email or password');
    if (user.banned) throw Error('This account has been suspended.');
    await createSessionCookie({ id: user.id, email: user.email, name: user.name });
    return Response.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { return fail(e); }
}
