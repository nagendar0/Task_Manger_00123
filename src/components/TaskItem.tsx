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

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <Card className="p-4 transition-all hover:shadow-md">
      <div className="flex items-start gap-3">
        <Checkbox
          id={task.id}
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <label
            htmlFor={task.id}
            className={cn(
              'block font-medium cursor-pointer transition-all',
              task.completed && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </label>
          {task.description && (
            <p
              className={cn(
                'text-sm text-muted-foreground mt-1',
                task.completed && 'line-through'
              )}
            >
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Flag className={cn('h-3 w-3', priorityColors[task.priority])} />
            <span className={cn('text-xs', priorityColors[task.priority])}>
              {priorityLabels[task.priority]}
            </span>
            {task.dueAt && (
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                Due {new Date(task.dueAt).toLocaleDateString()} {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
