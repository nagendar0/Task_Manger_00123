import { CheckCircle2, Clock3, ListTodo, Target } from 'lucide-react';
import { useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';

export function StatsOverview() {
  const tasks = useTaskStore((state) => state.tasks);

  const { total, active, completed, completionRate, lastCompletedLabel } = useMemo(() => {
    const total = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed);
    const active = total - completedTasks.length;
    const completed = completedTasks.length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
    const lastCompleted = completedTasks
      .map((t) => (t.completedAt ? new Date(t.completedAt) : t.createdAt))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const lastCompletedLabel = lastCompleted ? lastCompleted.toLocaleString() : '-';

    return { total, active, completed, completionRate, lastCompletedLabel };
  }, [tasks]);

  const cards = [
    {
      label: 'Total tasks',
      value: total,
      icon: <ListTodo className="h-4 w-4" />,
      accent: 'bg-sky-100 text-sky-700',
      shell: 'border-sky-200/70 bg-[linear-gradient(140deg,#eff6ff_0%,#ffffff_100%)]',
    },
    {
      label: 'Active',
      value: active,
      icon: <Clock3 className="h-4 w-4" />,
      accent: 'bg-amber-100 text-amber-700',
      shell: 'border-amber-200/70 bg-[linear-gradient(140deg,#fffbeb_0%,#ffffff_100%)]',
    },
    {
      label: 'Completed',
      value: completed,
      icon: <CheckCircle2 className="h-4 w-4" />,
      accent: 'bg-emerald-100 text-emerald-700',
      shell: 'border-emerald-200/70 bg-[linear-gradient(140deg,#ecfdf5_0%,#ffffff_100%)]',
    },
    {
      label: 'Completion rate',
      value: `${completionRate}%`,
      icon: <Target className="h-4 w-4" />,
      accent: 'bg-cyan-100 text-cyan-700',
      shell: 'border-cyan-200/70 bg-[linear-gradient(140deg,#ecfeff_0%,#ffffff_100%)]',
      sub: lastCompletedLabel === '-' ? 'No completions yet' : `Last: ${lastCompletedLabel}`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border px-4 py-3 shadow-[0_10px_25px_rgba(15,23,42,0.08)] ${card.shell}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">{card.label}</span>
            <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${card.accent}`}>
              {card.icon}
            </span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</div>
          {card.sub && <div className="mt-1 text-xs text-slate-500">{card.sub}</div>}
        </div>
      ))}
    </div>
  );
}

export default StatsOverview;
