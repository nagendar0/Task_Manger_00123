import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskPriority, HistoryEntry } from '@/types/task';

interface TaskState {
  tasks: Task[];
  history: HistoryEntry[];
  filter: 'all' | 'active' | 'completed';
  statusMessage?: string;
  addTask: (title: string, description: string, priority: TaskPriority, dueAt?: Date | null) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  clearCompleted: () => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  setStatusMessage: (msg?: string) => void;
}

type PersistedTaskState = Partial<Pick<TaskState, 'history'>>;

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      history: [],
      filter: 'all',
      statusMessage: undefined,
      
      addTask: (title, description, priority, dueAt = null) => {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title,
          description,
          completed: false,
          completedAt: null,
          dueAt,
          priority,
          createdAt: new Date(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },
      
      toggleTask: (id) => {
        set((state) => {
          let history = state.history;
          let statusMessage: string | undefined = state.statusMessage;

          const tasks = state.tasks.map((task) => {
            if (task.id !== id) return task;
            const now = new Date();
            const completed = !task.completed;

            if (completed) {
              const entry: HistoryEntry = {
                id: crypto.randomUUID(),
                title: task.title,
                description: task.description,
                priority: task.priority,
                createdAt: (task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt)).toISOString(),
                completedAt: now.toISOString(),
              };
              history = [entry, ...history].slice(0, 500);
              statusMessage = 'Task marked as completed';
            } else {
              statusMessage = 'Task moved back to active tasks';
            }

            return {
              ...task,
              completed,
              completedAt: completed ? now : null,
            };
          });

          return { tasks, history, statusMessage };
        });

        // clear message after a short delay
        setTimeout(() => {
          set({ statusMessage: undefined });
        }, 2000);
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },
      
      setFilter: (filter) => {
        set({ filter });
      },
      
      clearCompleted: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed),
        }));
      },

      addHistoryEntry: (entry) => {
        set((state) => ({
          history: [entry, ...state.history].slice(0, 500),
        }));
      },

      setStatusMessage: (msg) => set({ statusMessage: msg }),
    }),
    {
      name: 'task-storage',
      version: 2,
      partialize: (state) => ({
        tasks: state.tasks,
        history: state.history,
        filter: state.filter,
      }),
      migrate: (persisted: unknown) => {
        const state = (persisted ?? {}) as PersistedTaskState;
        // ensure history exists after upgrade
        if (!Array.isArray(state.history)) {
          state.history = [];
        }
        return state;
      },
    }
  )
);
