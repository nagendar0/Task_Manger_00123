import { useTaskStore } from '@/store/taskStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'active' | 'completed';

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function TaskFilter() {
  const { filter, setFilter, tasks, clearCompleted } = useTaskStore();
  
  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-cyan-200/70 bg-[linear-gradient(135deg,#f0f9ff_0%,#ecfeff_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-all',
              filter === f.value
                ? 'bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] text-white shadow-[0_10px_22px_rgba(14,165,233,0.3)]'
                : 'text-slate-700 hover:bg-white/90'
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span className="rounded-full bg-white/80 px-2 py-1 font-semibold text-sky-700">{activeCount} active</span>
        <span className="rounded-full bg-white/80 px-2 py-1 font-semibold text-emerald-700">{completedCount} completed</span>
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompleted}
            className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            Clear completed
          </Button>
        )}
      </div>
    </div>
  );
}
