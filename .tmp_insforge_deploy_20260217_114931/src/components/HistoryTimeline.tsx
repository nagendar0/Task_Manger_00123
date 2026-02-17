import { CalendarClock, Clock3, ListChecks, Timer } from 'lucide-react';
import { useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import type { TaskPriority, HistoryEntry } from '@/types/task';

type CompletedWithDates = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  completedAt: Date;
  createdAt: Date;
};

const humanizeMs = (ms: number) => {
  if (ms <= 0) return '0m';
  if (ms < 60_000) return '<1m';
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
};

const formatDuration = (start: Date, end: Date) => humanizeMs(end.getTime() - start.getTime());

const dayLabel = (date: Date) => {
  const today = new Date();
  const d = new Date(date);
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString();
};

const priorityBadge: Record<TaskPriority, string> = {
  high: 'bg-rose-50 text-rose-700 border border-rose-100',
  medium: 'bg-amber-50 text-amber-700 border border-amber-100',
  low: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
};

const spanDuration = (items: CompletedWithDates[]) => {
  const minStart = Math.min(...items.map((i) => i.createdAt.getTime()));
  const maxDone = Math.max(...items.map((i) => i.completedAt.getTime()));
  return formatDuration(new Date(minStart), new Date(maxDone));
};

export function HistoryTimeline() {
  const tasks = useTaskStore((state) => state.tasks);
  const history = useTaskStore((state) => state.history);

  const completed = useMemo<CompletedWithDates[]>(() => {
    // Prefer persisted history entries so they remain even if tasks are deleted
    const fromHistory: CompletedWithDates[] = (history as HistoryEntry[]).map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      priority: h.priority,
      createdAt: new Date(h.createdAt),
      completedAt: new Date(h.completedAt),
    }));

    const signature = (item: {
      title: string;
      description: string;
      priority: TaskPriority;
      createdAt: Date;
      completedAt: Date;
    }) =>
      [
        item.title,
        item.description,
        item.priority,
        item.createdAt.toISOString(),
        item.completedAt.toISOString(),
      ].join('|');

    const seen = new Set(fromHistory.map((item) => signature(item)));

    // Include currently completed tasks that may not yet be logged (edge cases).
    // Skip entries already represented in persisted history to avoid duplicates.
    const fromTasks: CompletedWithDates[] = tasks
      .filter((t) => t.completed)
      .map((t) => {
        const completedAt = t.completedAt ? new Date(t.completedAt) : new Date(t.createdAt);
        const createdAt = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          completedAt,
          createdAt,
        };
      })
      .filter((item) => {
        const key = signature(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return [...fromHistory, ...fromTasks].sort(
      (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
    );
  }, [history, tasks]);

  const summary = useMemo(() => {
    if (!completed.length) return null;
    const durations = completed.map((t) => t.completedAt.getTime() - t.createdAt.getTime());
    const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
    const fastestMs = Math.min(...durations);
    const slowestMs = Math.max(...durations);
    return {
      total: completed.length,
      avg: humanizeMs(avgMs),
      fastest: humanizeMs(fastestMs),
      slowest: humanizeMs(slowestMs),
    };
  }, [completed]);

  const grouped = useMemo(
    () => {
      const buckets: {
        label: string;
        date: Date;
        items: CompletedWithDates[];
      }[] = [];

      completed.forEach((task) => {
        const key = task.completedAt.toLocaleDateString();
        const found = buckets.find((b) => b.date.toLocaleDateString() === key);
        if (found) {
          found.items.push(task);
        } else {
          buckets.push({ label: dayLabel(task.completedAt), date: task.completedAt, items: [task] });
        }
      });

      return buckets.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    [completed]
  );

  if (!completed.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        No completed tasks yet. Finish a task to see rich history details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Completed</p>
            <p className="text-2xl font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Avg duration</p>
            <p className="text-2xl font-semibold text-slate-900">{summary.avg}</p>
            <p className="text-xs text-slate-500">Fastest {summary.fastest}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Longest</p>
            <p className="text-lg font-semibold text-slate-900">{summary.slowest}</p>
            <p className="text-xs text-slate-500">Across all completed tasks</p>
          </div>
        </div>
      )}

      {grouped.map((bucket) => (
        <div key={bucket.label} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {bucket.label}
              </p>
              <p className="text-xs text-slate-500">{bucket.items.length} completed</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <CalendarClock className="h-4 w-4" />
              Span {spanDuration(bucket.items)}
            </div>
          </div>

          <div className="space-y-3">
            {bucket.items.map((task, idx) => (
              <div
                key={task.id}
                className="relative flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="relative flex w-12 flex-col items-center">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <ListChecks className="h-4 w-4" />
                  </div>
                  {idx < bucket.items.length - 1 && (
                    <span className="absolute left-1/2 top-9 h-[calc(100%-18px)] w-px -translate-x-1/2 bg-slate-200" />
                  )}
                  <span className="mt-2 text-[11px] font-semibold text-slate-500">
                    {task.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityBadge[task.priority]}`}
                    >
                      {task.priority} priority
                    </span>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-xs text-slate-600">{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      Completed {task.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                      <Timer className="h-3.5 w-3.5" />
                      Duration {formatDuration(task.createdAt, task.completedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                      Started {task.createdAt.toLocaleDateString()} {task.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default HistoryTimeline;
