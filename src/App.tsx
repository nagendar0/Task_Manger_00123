import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  LayoutDashboard,
  Loader2,
  Users2,
  Table2,
  TimerReset,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { TaskEmailScheduler } from '@/components/TaskEmailScheduler';
import { AdminHistoryPanel } from '@/components/AdminHistoryPanel';

const toDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

function App() {
  const { user, initialized, initialize } = useAuthStore();
  const loadUserData = useTaskStore((s) => s.loadUserData);
  const resetUserData = useTaskStore((s) => s.resetUserData);
  const isHydrating = useTaskStore((s) => s.isHydrating);
  const [view, setView] = useState<'tasks' | 'history' | 'tables' | 'users'>('tasks');
  const statusMessage = useTaskStore((s) => s.statusMessage);
  const tasks = useTaskStore((s) => s.tasks);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const [showHero, setShowHero] = useState(true);
  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'tables', label: 'Tables', icon: <Table2 className="h-4 w-4" /> },
    { id: 'history', label: 'History', icon: <TimerReset className="h-4 w-4" /> },
    { id: 'users', label: 'Users', icon: <Users2 className="h-4 w-4" /> },
  ] as const;

  const summary = useMemo(() => {
    const now = Date.now();
    const activeTasks = tasks.filter((task) => !task.completed);
    const highPriorityCount = activeTasks.filter((task) => task.priority === 'high').length;
    const datedTasks = activeTasks
      .map((task) => ({ task, dueDate: toDate(task.dueAt) }))
      .filter(
        (entry): entry is { task: (typeof activeTasks)[number]; dueDate: Date } => entry.dueDate !== null
      );

    const dueSoonCount = datedTasks.filter((entry) => {
      const delta = entry.dueDate.getTime() - now;
      return delta >= 0 && delta <= 48 * 60 * 60 * 1000;
    }).length;
    const overdueCount = datedTasks.filter((entry) => entry.dueDate.getTime() < now).length;
    const nextDue = datedTasks
      .filter((entry) => entry.dueDate.getTime() >= now)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return {
      activeCount: activeTasks.length,
      highPriorityCount,
      dueSoonCount,
      overdueCount,
      completionRate,
      nextDueLabel: nextDue ? `${nextDue.task.title} - ${nextDue.dueDate.toLocaleString()}` : 'No upcoming due tasks.',
    };
  }, [tasks, totalTasks, completedTasks]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!user?.id) {
      resetUserData();
      return;
    }
    void loadUserData(user.id);
  }, [user?.id, loadUserData, resetUserData]);

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

  if (isHydrating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your secure tasks...</p>
        </div>
      </div>
    );
  }

  // Show main app if logged in
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: easeOut }}
      className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#fff7ed_0%,#eff6ff_45%,#ecfeff_100%)]"
    >
      <div className="pointer-events-none absolute -left-24 top-8 h-80 w-80 rounded-full bg-[#fb7185]/20 blur-3xl animate-orb-drift-slow" />
      <div className="pointer-events-none absolute right-0 top-36 h-96 w-96 rounded-full bg-[#38bdf8]/20 blur-3xl animate-orb-drift-reverse" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#34d399]/20 blur-3xl animate-orb-drift-slow [animation-delay:-5s]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.06)_1px,transparent_0)] [background-size:26px_26px] opacity-20" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8"
      >
        <TaskEmailScheduler />
        <motion.div variants={fadeUpItem}>
          <Navbar />
        </motion.div>

        <motion.div variants={fadeUpItem} className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {statusMessage && (
                <motion.div
                  key={statusMessage}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: easeOut }}
                  className="rounded-xl border border-emerald-200/80 bg-[linear-gradient(120deg,#ecfdf5_0%,#d1fae5_100%)] px-4 py-3 text-sm font-semibold text-emerald-800 shadow-[0_10px_22px_rgba(16,185,129,0.12)]"
                >
                  {statusMessage}
                </motion.div>
              )}
            </AnimatePresence>
            {totalTasks > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: easeOut }}
                className="rounded-xl border border-sky-200/70 bg-[linear-gradient(120deg,#eff6ff_0%,#ecfeff_100%)] px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_10px_22px_rgba(14,165,233,0.12)]"
              >
                {completedTasks} of {totalTasks} tasks completed
              </motion.div>
            )}
            {totalTasks > 0 && completedTasks === totalTasks && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: easeOut }}
                className="rounded-xl border border-emerald-200/80 bg-[linear-gradient(120deg,#ecfdf5_0%,#d1fae5_100%)] px-4 py-3 text-sm font-semibold text-emerald-800 shadow-[0_10px_22px_rgba(16,185,129,0.12)]"
              >
                All tasks in this table are completed
              </motion.div>
            )}
          </div>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: easeOut }}
            className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(150deg,rgba(255,255,255,0.95)_0%,rgba(236,254,255,0.92)_100%)] px-4 py-3 shadow-[0_12px_30px_rgba(14,165,233,0.12)] backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Workspace pulse</p>
              <CheckCircle2 className="h-4 w-4 text-sky-600" />
            </div>
            <p className="mt-2 bg-gradient-to-r from-sky-700 via-cyan-700 to-emerald-700 bg-clip-text text-2xl font-semibold text-transparent">
              {summary.completionRate}%
            </p>
            <p className="text-xs text-slate-600">Overall completion rate</p>
            <div className="mt-3 h-2 rounded-full bg-white/80">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#0ea5e9] via-[#06b6d4] to-[#22c55e]"
                initial={{ width: 0 }}
                animate={{ width: `${summary.completionRate}%` }}
                transition={{ duration: 0.8, ease: easeOut }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-700">
              <span className="rounded-lg bg-sky-100/80 px-2 py-1 text-center text-sky-700">Active {summary.activeCount}</span>
              <span className="rounded-lg bg-amber-100/80 px-2 py-1 text-center text-amber-700">Soon {summary.dueSoonCount}</span>
              <span className="rounded-lg bg-rose-100/80 px-2 py-1 text-center text-rose-700">Overdue {summary.overdueCount}</span>
            </div>
          </motion.aside>
        </motion.div>

        <AnimatePresence initial={false}>
          {showHero && (
            <motion.section
              key="hero"
              initial={{ opacity: 0, y: 20, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.985 }}
              transition={{ duration: 0.46, ease: easeOut }}
              className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(120deg,rgba(255,255,255,0.96)_0%,rgba(255,247,237,0.93)_45%,rgba(236,254,255,0.93)_100%)] shadow-[0_22px_52px_rgba(15,23,42,0.12)] backdrop-blur"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-[#38bdf8]/25 blur-3xl animate-orb-drift-reverse" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-52 w-52 rounded-full bg-[#f97316]/20 blur-3xl animate-orb-drift-slow" />
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
                <motion.div variants={fadeUpItem} className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Welcome to structured tables</p>
                    <h1 className="mt-1 bg-gradient-to-r from-slate-900 via-cyan-800 to-teal-800 bg-clip-text text-2xl font-semibold leading-tight text-transparent sm:text-3xl">
                      Build layered schedules, assign priorities, and track momentum across every screen size.
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-700 sm:text-base">
                      The dashboard adapts from compact mobile stacks to multi-column workspace views on larger displays.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setView('tasks');
                        setShowHero(false);
                      }}
                      className="rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(14,165,233,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(14,165,233,0.35)]"
                    >
                      Start planning now
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHero(false)}
                      className="rounded-full border border-cyan-200 bg-white/90 px-5 py-3 text-sm font-semibold text-cyan-800 transition hover:-translate-y-0.5 hover:shadow-sm"
                    >
                      Hide intro
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <motion.div variants={fadeUpItem} className="rounded-2xl border border-rose-200/70 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_100%)] px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">High priority</p>
                    <p className="mt-1 text-2xl font-semibold text-rose-800">{summary.highPriorityCount}</p>
                    <p className="text-xs text-rose-700/80">Urgent active tasks</p>
                  </motion.div>
                  <motion.div variants={fadeUpItem} className="rounded-2xl border border-amber-200/70 bg-[linear-gradient(135deg,#fffbeb_0%,#ffffff_100%)] px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Due soon</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-800">{summary.dueSoonCount}</p>
                    <p className="text-xs text-amber-700/80">Within 48 hours</p>
                  </motion.div>
                  <motion.div variants={fadeUpItem} className="rounded-2xl border border-cyan-200/70 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_100%)] px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Next due task</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-900">{summary.nextDueLabel}</p>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.div variants={fadeUpItem} className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-full flex-wrap items-center gap-2 rounded-2xl border border-sky-200/60 bg-[linear-gradient(120deg,rgba(255,255,255,0.95)_0%,rgba(240,249,255,0.92)_100%)] p-2 shadow-sm xl:w-auto">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.98 }}
                whileHover={view === tab.id ? {} : { y: -2 }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  view === tab.id
                    ? 'relative text-white shadow-[0_10px_20px_rgba(14,165,233,0.3)]'
                    : 'text-slate-700 hover:-translate-y-0.5 hover:bg-white'
                }`}
                onClick={() => setView(tab.id)}
              >
                {view === tab.id && (
                  <motion.span
                    layoutId="active-view-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6]"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </motion.button>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -2 }}
            type="button"
            onClick={() => setShowHero((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <CalendarClock className="h-4 w-4" />
            {showHero ? 'Collapse Intro' : 'Expand Intro'}
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'tasks' && (
            <motion.main
              key="tasks-view"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]"
            >
              <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
                <motion.div variants={fadeUpItem}>
                  <StatsOverview />
                </motion.div>
                <motion.div variants={fadeUpItem}>
                  <ScheduleBoard />
                </motion.div>
                <motion.section
                  variants={fadeUpItem}
                  className="rounded-2xl border border-sky-200/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.94)_0%,rgba(239,246,255,0.92)_100%)] p-4 shadow-[0_12px_26px_rgba(14,165,233,0.12)] sm:p-5"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">Task Queue</h2>
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {summary.activeCount} active
                    </span>
                  </div>
                  <TaskList />
                </motion.section>
              </motion.div>

              <motion.aside variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 2xl:sticky 2xl:top-6 2xl:self-start">
                <motion.section
                  variants={fadeUpItem}
                  className="rounded-2xl border border-cyan-200/70 bg-[linear-gradient(145deg,rgba(236,254,255,0.93)_0%,rgba(255,255,255,0.92)_100%)] p-4 shadow-[0_12px_26px_rgba(8,145,178,0.14)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Quick actions</p>
                  <h3 className="mt-1 text-lg font-semibold text-cyan-900">Capture tasks fast</h3>
                  <p className="mt-1 text-sm text-cyan-900/80">
                    Add a task with due date and priority from anywhere in the dashboard.
                  </p>
                  <div className="mt-4">
                    <AddTaskDialog triggerClassName="w-full justify-center rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] py-6 text-sm font-semibold text-white hover:from-[#0284c7] hover:to-[#0f766e]" />
                  </div>
                </motion.section>

                <motion.div variants={fadeUpItem}>
                  <TaskFilter />
                </motion.div>

                <motion.section
                  variants={fadeUpItem}
                  className="rounded-2xl border border-amber-200/70 bg-[linear-gradient(145deg,rgba(255,251,235,0.94)_0%,rgba(255,255,255,0.93)_100%)] p-4 shadow-[0_12px_26px_rgba(245,158,11,0.12)]"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Deadline radar</p>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <p className="rounded-xl bg-white/80 px-3 py-2">
                      Overdue tasks: <span className="font-semibold text-rose-700">{summary.overdueCount}</span>
                    </p>
                    <p className="rounded-xl bg-white/80 px-3 py-2">
                      Due in 48h: <span className="font-semibold text-amber-700">{summary.dueSoonCount}</span>
                    </p>
                    <p className="rounded-xl bg-white/80 px-3 py-2 text-xs sm:text-sm">{summary.nextDueLabel}</p>
                  </div>
                </motion.section>
              </motion.aside>
            </motion.main>
          )}

          {view === 'tables' && (
            <motion.main
              key="tables-view"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="space-y-6"
            >
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, ease: easeOut }}
                className="rounded-2xl border border-cyan-200/70 bg-[linear-gradient(135deg,rgba(236,254,255,0.95)_0%,rgba(255,255,255,0.92)_100%)] px-4 py-3 shadow-[0_12px_26px_rgba(8,145,178,0.14)] sm:px-5"
              >
                <h2 className="text-lg font-semibold text-slate-900">Saved Tables Workspace</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Search your saved tables and open detailed schedule rows from any device width.
                </p>
              </motion.section>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: 0.06, ease: easeOut }}>
                <ScheduleBoard minimal />
              </motion.div>
            </motion.main>
          )}

          {view === 'history' && (
            <motion.main
              key="history-view"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="space-y-4"
            >
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, ease: easeOut }}
                className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(135deg,rgba(239,246,255,0.95)_0%,rgba(255,255,255,0.92)_100%)] px-4 py-3 shadow-[0_12px_26px_rgba(14,165,233,0.12)] sm:px-5"
              >
                <h2 className="text-lg font-semibold text-slate-900">Completion History</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Timeline view of finished tasks and completion speed metrics.
                </p>
              </motion.section>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: 0.06, ease: easeOut }}>
                <HistoryTimeline />
              </motion.div>
            </motion.main>
          )}

          {view === 'users' && (
            <motion.main
              key="users-view"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="space-y-4"
            >
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, ease: easeOut }}
                className="rounded-2xl border border-sky-200/70 bg-[linear-gradient(135deg,rgba(239,246,255,0.95)_0%,rgba(255,255,255,0.92)_100%)] px-4 py-3 shadow-[0_12px_26px_rgba(14,165,233,0.12)] sm:px-5"
              >
                <h2 className="text-lg font-semibold text-slate-900">User History Admin</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Click any user ID to see all their stored task completion history.
                </p>
              </motion.section>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: 0.06, ease: easeOut }}>
                <AdminHistoryPanel />
              </motion.div>
            </motion.main>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default App;
