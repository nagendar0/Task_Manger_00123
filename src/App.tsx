import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { TaskList } from '@/components/TaskList';
import { TaskFilter } from '@/components/TaskFilter';
import { AuthPage } from '@/components/AuthPage';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { Navbar } from '@/components/Navbar';
import { HistoryTimeline } from '@/components/HistoryTimeline';
import { StatsOverview } from '@/components/StatsOverview';
import { ScheduleBoard } from '@/components/ScheduleBoard';

function App() {
  const { user, initialized, initialize } = useAuthStore();
  const [view, setView] = useState<'tasks' | 'history' | 'tables'>('tasks');
  const statusMessage = useTaskStore((s) => s.statusMessage);
  const tasks = useTaskStore((s) => s.tasks);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const [showHero, setShowHero] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading while checking auth state
  if (!initialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show main app if logged in
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Navbar />

        <div className="mb-4 space-y-2">
          {statusMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
              {statusMessage}
            </div>
          )}
          {totalTasks > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
              {completedTasks} of {totalTasks} tasks completed
            </div>
          )}
          {totalTasks > 0 && completedTasks === totalTasks && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
              All tasks in this table are completed
            </div>
          )}
        </div>

        {showHero && (
          <div className="mb-6 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Welcome to Structured Tables</p>
                <h1 className="text-2xl font-semibold text-slate-900">Create tables to schedule tasks by time and receive reminders automatically.</h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setView('tables');
                    setShowHero(false);
                  }}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  Create your first table
                </button>
                <button
                  type="button"
                  onClick={() => setShowHero(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  Got it
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
              Mobile banner: Optimized for mobile. Swipe horizontally to view full table details. Rotate your device for the best viewing experience.
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === 'tasks'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:-translate-y-0.5 hover:shadow-sm'
            }`}
            onClick={() => setView('tasks')}
          >
            Tasks
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === 'tables'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:-translate-y-0.5 hover:shadow-sm'
            }`}
            onClick={() => setView('tables')}
          >
            Tables
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              view === 'history'
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:-translate-y-0.5 hover:shadow-sm'
            }`}
            onClick={() => setView('history')}
          >
            History
          </button>
        </div>

        {view === 'tasks' && (
          <div className="mb-6">
            <StatsOverview />
          </div>
        )}

        {view === 'tasks' && (
          <div className="mb-6">
            <ScheduleBoard />
          </div>
        )}

        {view === 'tables' && (
          <div className="mb-6">
            <ScheduleBoard minimal />
          </div>
        )}

        {view === 'tasks' ? (
          <>
            <div className="mb-6 hidden sm:block">
              <AddTaskDialog />
            </div>

            <div className="mb-6">
              <TaskFilter />
            </div>

            <main>
              <TaskList />
            </main>
          </>
        ) : view === 'history' ? (
          <main className="space-y-4">
            <HistoryTimeline />
          </main>
        ) : null}
      </div>
    </div>
  );
}

export default App;
