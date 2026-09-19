'use client';
import { useEffect, useState } from 'react';

type Spot = {
  id: string; owner: string; ownerName: string | null; ownerEmail: string | null;
  created: number; verified: boolean; title: string; region: string; categories: string[];
};
type UserRow = {
  id: string; name: string; email: string; created: number; banned: boolean; spotCount: number;
};

async function call(url: string, body?: unknown){
  const r = await fetch(url, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : undefined);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Something went wrong');
  return d;
}

export default function AdminPanel({ adminName }: { adminName: string }){
  const [tab, setTab] = useState<'spots' | 'users'>('spots');
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadSpots(){ setSpots((await call('/api/admin/spots')).spots); }
  async function loadUsers(){ setUsers((await call('/api/admin/users')).users); }

  useEffect(() => { loadSpots().catch(e => setMsg(e.message)); loadUsers().catch(e => setMsg(e.message)); }, []);

  async function spotAction(id: string, action: 'verify' | 'unverify' | 'delete'){
    if (action === 'delete' && !confirm('Permanently delete this listing? This cannot be undone.')) return;
    setBusy(id); setMsg(null);
    try { await call('/api/admin/spots', { id, action }); await loadSpots(); }
    catch (e: any) { setMsg(e.message); }
    finally { setBusy(null); }
  }

  async function userAction(id: string, action: 'ban' | 'unban'){
    if (action === 'ban' && !confirm('Ban this user? They will no longer be able to sign in or post.')) return;
    setBusy(id); setMsg(null);
    try { await call('/api/admin/users', { id, action }); await loadUsers(); }
    catch (e: any) { setMsg(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Hidden Trails · Admin</h1>
          <p className="text-xs text-neutral-500">Signed in as {adminName}</p>
        </div>
        <a href="/" className="text-sm text-neutral-400 underline">Back to app</a>
      </header>

      <nav className="px-6 pt-4 flex gap-2">
        <button onClick={() => setTab('spots')} className={`px-3 py-1.5 rounded-md text-sm ${tab === 'spots' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-300'}`}>
          Listings {spots ? `(${spots.length})` : ''}
        </button>
        <button onClick={() => setTab('users')} className={`px-3 py-1.5 rounded-md text-sm ${tab === 'users' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-300'}`}>
          Users {users ? `(${users.length})` : ''}
        </button>
      </nav>

      {msg && <div className="mx-6 mt-4 text-sm text-red-300 bg-red-950/50 border border-red-900 rounded-md px-3 py-2">{msg}</div>}

      <main className="p-6">
        {tab === 'spots' && (
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-neutral-400 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Region</th>
                  <th className="px-4 py-2 font-medium">Scout</th>
                  <th className="px-4 py-2 font-medium">Added</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {spots === null && <tr><td className="px-4 py-6 text-neutral-500" colSpan={6}>Loading…</td></tr>}
                {spots?.length === 0 && <tr><td className="px-4 py-6 text-neutral-500" colSpan={6}>No listings yet.</td></tr>}
                {spots?.map(s => (
                  <tr key={s.id} className="border-t border-neutral-800">
                    <td className="px-4 py-2">{s.title}</td>
                    <td className="px-4 py-2 text-neutral-400">{s.region}</td>
                    <td className="px-4 py-2 text-neutral-400">{s.ownerName || 'Unknown'}<div className="text-xs text-neutral-600">{s.ownerEmail}</div></td>
                    <td className="px-4 py-2 text-neutral-500">{new Date(s.created).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{s.verified ? <span className="text-emerald-400">Verified</span> : <span className="text-neutral-500">Unverified</span>}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button disabled={busy === s.id} onClick={() => spotAction(s.id, s.verified ? 'unverify' : 'verify')} className="text-xs underline mr-3 disabled:opacity-40">
                        {s.verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button disabled={busy === s.id} onClick={() => spotAction(s.id, 'delete')} className="text-xs underline text-red-400 disabled:opacity-40">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'users' && (
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-neutral-400 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                  <th className="px-4 py-2 font-medium">Listings</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users === null && <tr><td className="px-4 py-6 text-neutral-500" colSpan={6}>Loading…</td></tr>}
                {users?.map(u => (
                  <tr key={u.id} className="border-t border-neutral-800">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2 text-neutral-400">{u.email}</td>
                    <td className="px-4 py-2 text-neutral-500">{new Date(u.created).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-neutral-400">{u.spotCount}</td>
                    <td className="px-4 py-2">{u.banned ? <span className="text-red-400">Banned</span> : <span className="text-emerald-400">Active</span>}</td>
                    <td className="px-4 py-2">
                      <button disabled={busy === u.id} onClick={() => userAction(u.id, u.banned ? 'unban' : 'ban')} className="text-xs underline disabled:opacity-40">
                        {u.banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
