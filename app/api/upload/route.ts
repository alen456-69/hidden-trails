import { put } from '@vercel/blob';
import { getSessionUser } from '@/lib/auth';
import { db, fail, sameOrigin } from '@/lib/server';

const EXT: Record<string,string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/webm': 'webm',
};

export async function POST(req: Request){
  try {
    sameOrigin(req);
    const u = await getSessionUser();
    if (!u) return Response.json({ error: 'Sign in to upload' }, { status: 401 });
    if (Number(req.headers.get('content-length')) > 26000000) throw Error('File must be under 25 MB');
    const f = (await req.formData()).get('file');
    if (!(f instanceof File) || !EXT[f.type]) throw Error('Use JPG, PNG, WebP, MP4, or WebM');
    if (f.size > 25000000) throw Error('File must be under 25 MB');
    const id = crypto.randomUUID();
    const key = `${id}.${EXT[f.type]}`;
    const blob = await put(key, f, { access: 'public', contentType: f.type, addRandomSuffix: false });
    await db().prepare('INSERT INTO uploads (id,user,type) VALUES (?,?,?)').bind(key, u.userId, f.type).run();
    return Response.json({ url: blob.url });
  } catch (e) { return fail(e); }
}
