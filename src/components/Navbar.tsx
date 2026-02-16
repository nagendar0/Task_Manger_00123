import { ClipboardList, LogOut, UserRound } from 'lucide-react';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export function Navbar() {
  const { user, signOut } = useAuthStore();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-200/60 bg-[linear-gradient(140deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.9)_100%)] px-4 py-3 shadow-[0_16px_32px_rgba(14,165,233,0.12)] backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#14b8a6] text-white shadow-[0_10px_20px_rgba(14,165,233,0.35)]">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="bg-gradient-to-r from-slate-900 via-sky-800 to-teal-700 bg-clip-text text-xl font-semibold leading-tight text-transparent">
            Task Manager
          </h1>
          <p className="text-sm text-slate-700">Organize your tasks beautifully</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="hidden sm:block">
          <AddTaskDialog triggerClassName="rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] px-4 text-white hover:from-[#0284c7] hover:to-[#0f766e]" />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-cyan-200/80 bg-cyan-50/70 px-3 py-2 text-sm text-cyan-800">
          <UserRound className="h-4 w-4 text-cyan-700" />
          <span className="font-medium">{user?.email ?? 'Guest'}</span>
        </div>

        <Button
          variant="outline"
          className="gap-2 rounded-xl border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100/70"
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
