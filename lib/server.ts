import { createClient } from '@libsql/client';

let client: ReturnType<typeof createClient> | null = null;
function client_(){
  if(!client){
    const url = process.env.TURSO_DATABASE_URL;
    if(!url) throw Error('Storage is temporarily unavailable');
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

// Small D1-compatible facade so the original prepare().bind().run()/.first()/.all()
// and db.batch([...]) call sites work unchanged against a libSQL/Turso database.
class Bound {
  constructor(private sql: string, private args: unknown[]) {}
  private async exec(){
    const r = await client_().execute({ sql: this.sql, args: this.args as any });
    return r;
  }
  async run(){ const r = await this.exec(); return { success:true, results:r.rows as any[], meta:{ changes:r.rowsAffected, last_row_id:r.lastInsertRowid } }; }
  async all(){ const r = await this.exec(); return { results:r.rows as any[], success:true }; }
  async first<T=any>(): Promise<T|null>{ const r = await this.exec(); return (r.rows[0] as any) ?? null; }
}
class Stmt {
  constructor(private sql: string) {}
  bind(...args: unknown[]){ return new Bound(this.sql, args); }
  run(){ return new Bound(this.sql, []).run(); }
  all(){ return new Bound(this.sql, []).all(); }
  first<T=any>(){ return new Bound(this.sql, []).first<T>(); }
}
export function db(){
  return {
    prepare(sql: string){ return new Stmt(sql); },
    async batch(stmts: Array<Bound|Stmt>){
      const out: any[] = [];
      for(const s of stmts) out.push(await (s as any).all());
      return out;
    },
  };
}

export function fail(e: unknown){ console.error(e); return Response.json({ error: e instanceof Error ? e.message : 'Please try again.' }, { status: 400 }); }
export function sameOrigin(req: Request){ const o = req.headers.get('origin'); if(o && o !== new URL(req.url).origin) throw Error('Invalid origin'); }
