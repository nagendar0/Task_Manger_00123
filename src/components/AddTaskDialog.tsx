import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useTaskStore } from '@/store/taskStore';
import type { TaskPriority } from '@/types/task';
import { cn } from '@/lib/utils';

type AddTaskDialogProps = {
  triggerClassName?: string;
};

export function AddTaskDialog({ triggerClassName }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [restMinutes, setRestMinutes] = useState('');
  const addTask = useTaskStore((state) => state.addTask);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let dueAt: Date | null = null;
    if (dueDate && dueTime) {
      dueAt = new Date(`${dueDate}T${dueTime}:00`);
    } else if (dueDate) {
      dueAt = new Date(`${dueDate}T00:00:00`);
    }

    const parsedRestMinutes = Number.parseInt(restMinutes, 10);
    const normalizedRestMinutes =
      Number.isFinite(parsedRestMinutes) && parsedRestMinutes > 0 ? parsedRestMinutes : null;

    addTask(title.trim(), description.trim(), priority, dueAt, normalizedRestMinutes);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setDueTime('');
    setRestMinutes('');
    setOpen(false);
  };

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn('gap-2', triggerClassName)}>
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task with a title, description, and priority level.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description (optional)..."
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Due date
                </label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="dueTime" className="text-sm font-medium">
                  Due time
                </label>
                <Input
                  id="dueTime"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="restMinutes" className="text-sm font-medium">
                Rest reminder (minutes after start)
              </label>
              <Input
                id="restMinutes"
                type="number"
                min={1}
                step={1}
                value={restMinutes}
                onChange={(e) => setRestMinutes(e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Priority</label>
              <div className="flex gap-2">
                {priorityOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={priority === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPriority(option.value)}
                    className="flex-1 gap-2"
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        option.color
                      )}
                    />
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Add Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
