import { ClipboardList, LogOut, Plus, UserRound } from 'lucide-react';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export function Navbar() {
  const { user, signOut } = useAuthStore();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-black text-white shadow">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-tight text-slate-900">Task Manager</h1>
          <p className="text-sm text-slate-600">Organize your tasks efficiently</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="hidden sm:block">
          <AddTaskDialog triggerClassName="bg-black text-white hover:bg-neutral-900 rounded-lg px-4" />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <UserRound className="h-4 w-4 text-slate-500" />
          <span className="font-medium">{user?.email ?? 'Guest'}</span>
        </div>

        <Button
          variant="outline"
          className="gap-2 rounded-lg border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}

export default Navbar;
