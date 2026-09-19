import { z } from 'zod';
import { db, fail, sameOrigin } from '@/lib/server';
import { requireAdmin } from '@/lib/admin';

export async function GET(){
  try {
    await requireAdmin();
    const d = db();
    const { results } = await d.prepare(
      `SELECT users.id, users.name, users.email, users.created, users.banned,
              (SELECT COUNT(*) FROM spots WHERE spots.owner = users.id) AS spotCount
       FROM users
       ORDER BY users.created DESC`
    ).all();
    const users = (results as any[]).map(r => ({ ...r, banned: !!r.banned }));
    return Response.json({ users });
  } catch (e: any) { return fail(e); }
}

const actionSchema = z.object({
  id: z.string().min(1).max(150),
  action: z.enum(['ban', 'unban']),
});

export async function POST(req: Request){
  try {
    sameOrigin(req);
    const admin = await requireAdmin();
    const { id, action } = actionSchema.parse(await req.json());
    if (id === admin.userId && action === 'ban') throw Error("You can't ban your own account");
    const d = db();
    await d.prepare('UPDATE users SET banned=? WHERE id=?').bind(action === 'ban' ? 1 : 0, id).run();
    return Response.json({ ok: true });
  } catch (e: any) { return fail(e); }
}
