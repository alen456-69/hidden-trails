import { put } from '@vercel/blob';
import { getSessionUser } from '@/lib/auth';
import { db, fail, sameOrigin, rateLimit } from '@/lib/server';

const EXT: Record<string,string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'video/mp4': 'mp4', 'video/webm': 'webm',
};

function sniff(b: Uint8Array, type: string){
  const at = (o: number, ...a: number[]) => a.every((v, i) => b[o + i] === v);
  if(type === 'image/jpeg') return at(0, 0xff, 0xd8, 0xff);
  if(type === 'image/png') return at(0, 0x89, 0x50, 0x4e, 0x47);
  if(type === 'image/webp') return at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50);
  if(type === 'video/mp4') return at(4, 0x66, 0x74, 0x79, 0x70);
  if(type === 'video/webm') return at(0, 0x1a, 0x45, 0xdf, 0xa3);
  return false;
}

export async function POST(req: Request){
  try {
    sameOrigin(req);
    rateLimit(req, 'upload', 20);
    const u = await getSessionUser();
    if (!u) return Response.json({ error: 'Sign in to upload' }, { status: 401 });
    if (Number(req.headers.get('content-length')) > 26000000) throw Error('File must be under 25 MB');
    const f = (await req.formData()).get('file');
    if (!(f instanceof File) || !EXT[f.type]) throw Error('Use JPG, PNG, WebP, MP4, or WebM');
    if (f.size > 25000000) throw Error('File must be under 25 MB');
    if(!sniff(new Uint8Array(await f.slice(0, 12).arrayBuffer()), f.type)) throw Error('That file is not a valid image or video');
    const id = crypto.randomUUID();
    const key = `${id}.${EXT[f.type]}`;
    const blob = await put(key, f, { access: 'public', contentType: f.type, addRandomSuffix: false });
    await db().prepare('INSERT INTO uploads (id,user,type) VALUES (?,?,?)').bind(key, u.userId, f.type).run();
    return Response.json({ url: blob.url });
  } catch (e) { return fail(e); }
}
