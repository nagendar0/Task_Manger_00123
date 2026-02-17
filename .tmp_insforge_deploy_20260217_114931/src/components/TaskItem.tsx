import { Trash2, Flag } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const priorityBadgeStyles = {
  low: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200',
  medium: 'bg-amber-100/80 text-amber-700 border border-amber-200',
  high: 'bg-rose-100/80 text-rose-700 border border-rose-200',
};

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <Card className="rounded-2xl border border-sky-200/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.95)_0%,rgba(240,249,255,0.9)_100%)] p-4 shadow-[0_10px_24px_rgba(14,165,233,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(14,165,233,0.16)]">
      <div className="flex items-start gap-3">
        <Checkbox
          id={task.id}
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1 border-sky-300 data-[state=checked]:border-cyan-600 data-[state=checked]:bg-cyan-600"
        />
        <div className="flex-1 min-w-0">
          <label
            htmlFor={task.id}
            className={cn(
              'block cursor-pointer font-medium text-slate-900 transition-all',
              task.completed && 'line-through text-slate-500'
            )}
          >
            {task.title}
          </label>
          {task.description && (
            <p
              className={cn(
                'mt-1 text-sm text-slate-600',
                task.completed && 'line-through'
              )}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Flag className={cn('h-3 w-3', priorityColors[task.priority])} />
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', priorityBadgeStyles[task.priority])}>
              {priorityLabels[task.priority]}
            </span>
            {task.dueAt && (
              <span className="ml-1 rounded-full border border-sky-200 bg-sky-100/70 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                Due {new Date(task.dueAt).toLocaleDateString()} {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          className="shrink-0 rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
