import { z } from 'zod';
import { db, fail, sameOrigin } from '@/lib/server';
import { requireAdmin } from '@/lib/admin';

export async function GET(){
  try {
    await requireAdmin();
    const d = db();
    const { results } = await d.prepare(
      `SELECT spots.id, spots.owner, spots.data, spots.created, spots.verified,
              users.name AS ownerName, users.email AS ownerEmail
       FROM spots
       LEFT JOIN users ON users.id = spots.owner
       ORDER BY spots.created DESC`
    ).all();
    const spots = (results as any[]).map(r => {
      const parsed = JSON.parse(r.data);
      return {
        id: r.id, owner: r.owner, ownerName: r.ownerName, ownerEmail: r.ownerEmail,
        created: r.created, verified: !!r.verified,
        title: parsed.title, region: parsed.region, categories: parsed.categories,
      };
    });
    return Response.json({ spots });
  } catch (e: any) { return fail(e); }
}

const actionSchema = z.object({
  id: z.string().min(1).max(150),
  action: z.enum(['verify', 'unverify', 'delete']),
});

export async function POST(req: Request){
  try {
    sameOrigin(req);
    await requireAdmin();
    const { id, action } = actionSchema.parse(await req.json());
    const d = db();
    if (action === 'delete') {
      await d.prepare('DELETE FROM spots WHERE id=?').bind(id).run();
      await d.prepare('DELETE FROM actions WHERE spot=?').bind(id).run();
      await d.prepare('DELETE FROM comments WHERE spot=?').bind(id).run();
    } else {
      await d.prepare('UPDATE spots SET verified=? WHERE id=?').bind(action === 'verify' ? 1 : 0, id).run();
    }
    return Response.json({ ok: true });
  } catch (e: any) { return fail(e); }
}
