export type TaskPriority = 'low' | 'medium' | 'high';
export type HistorySource = 'task' | 'table';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date | string | null;
  dueAt?: Date | string | null;
  restMinutes?: number | null;
  priority: TaskPriority;
  createdAt: Date;
}

export interface HistoryEntry {
  id: string;
  taskId?: string | null;
  source?: HistorySource;
  title: string;
  description: string;
  priority: TaskPriority;
  createdAt: string; // ISO
  completedAt: string; // ISO
}
