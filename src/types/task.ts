export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date | string | null;
  dueAt?: Date | string | null;
  priority: TaskPriority;
  createdAt: Date;
}

export interface HistoryEntry {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  createdAt: string; // ISO
  completedAt: string; // ISO
}
