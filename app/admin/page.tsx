import { getSessionUser } from '@/lib/auth';
import AdminPanel from './admin-panel';

export const metadata = { title: 'Admin · Hidden Trails' };

export default async function AdminPage(){
  const user = await getSessionUser();
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-200 p-6">
        <div className="max-w-sm text-center space-y-2">
          <h1 className="text-xl font-semibold">Not authorized</h1>
          <p className="text-neutral-400 text-sm">
            {user ? "Your account doesn't have admin access." : "Sign in with an admin account to view this page."}
          </p>
          <a href="/" className="inline-block mt-4 text-sm underline text-neutral-300">Back to Hidden Trails</a>
        </div>
      </div>
    );
  }
  return <AdminPanel adminName={user.displayName} />;
}
