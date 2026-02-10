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
    <div className="flex flex-col gap-3 rounded-2xl bg-[#f8f8f8] px-4 py-3 shadow-inner sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-semibold transition-all',
              filter === f.value ? 'bg-[#1f1f1f] text-white shadow-sm' : 'text-slate-700 hover:bg-white'
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{activeCount} active</span>
        <span>{completedCount} completed</span>
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompleted}
            className="text-destructive hover:text-destructive"
          >
            Clear completed
          </Button>
        )}
      </div>
    </div>
  );
}
