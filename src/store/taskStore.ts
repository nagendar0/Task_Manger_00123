import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryEntry, HistorySource, Task, TaskPriority } from '@/types/task';
import { useAuthStore } from '@/store/authStore';
import {
  clearCompletedTaskRecords,
  deleteTaskRecord,
  fetchUserTaskSnapshot,
  insertHistoryRecord,
  insertTaskRecord,
  updateTaskRecord,
} from '@/lib/taskDatabase';

const HISTORY_LIMIT = 500;
let currentLoadSequence = 0;

const toIsoString = (value: Date | string | null | undefined): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};

const toDateValue = (value: Date | string | null | undefined): Date => {
  if (!value) {
    return new Date();
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

const normalizeTaskForState = (task: Task): Task => ({
  ...task,
  title: task.title ?? '',
  description: task.description ?? '',
  priority: task.priority === 'low' || task.priority === 'high' ? task.priority : 'medium',
  createdAt: toDateValue(task.createdAt),
  dueAt: task.dueAt ? toIsoString(task.dueAt) : null,
  completedAt: task.completedAt ? toIsoString(task.completedAt) : null,
  completed: Boolean(task.completed),
  restMinutes:
    typeof task.restMinutes === 'number' && task.restMinutes > 0 ? Math.floor(task.restMinutes) : null,
});

const normalizeHistoryEntryForState = (entry: HistoryEntry): HistoryEntry => ({
  ...entry,
  taskId: entry.taskId ?? null,
  source: entry.source === 'table' ? 'table' : 'task',
  title: entry.title ?? '',
  description: entry.description ?? '',
  priority: entry.priority === 'low' || entry.priority === 'high' ? entry.priority : 'medium',
  createdAt: toIsoString(entry.createdAt),
  completedAt: toIsoString(entry.completedAt),
});

const getCurrentUserId = () => useAuthStore.getState().user?.id ?? null;

const showSyncError = (set: (partial: Partial<TaskState>) => void, message = 'Cloud sync failed. Please retry.') => {
  set({ statusMessage: message });
  setTimeout(() => set({ statusMessage: undefined }), 3600);
};

interface TaskState {
  tasks: Task[];
  history: HistoryEntry[];
  filter: 'all' | 'active' | 'completed';
  statusMessage?: string;
  activeUserId: string | null;
  isHydrating: boolean;
  loadUserData: (userId: string) => Promise<void>;
  resetUserData: () => void;
  addTask: (
    title: string,
    description: string,
    priority: TaskPriority,
    dueAt?: Date | null,
    restMinutes?: number | null
  ) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  clearCompleted: () => void;
  addHistoryEntry: (entry: HistoryEntry, options?: { taskId?: string | null; source?: HistorySource }) => void;
  setStatusMessage: (msg?: string) => void;
}

type LegacyPersistedTaskState = Partial<
  Pick<TaskState, 'filter' | 'tasks' | 'history'>
>;

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      history: [],
      filter: 'all',
      statusMessage: undefined,
      activeUserId: null,
      isHydrating: false,

      loadUserData: async (userId) => {
        const loadSequence = ++currentLoadSequence;
        const localTasks = get().tasks.map(normalizeTaskForState);
        const localHistory = get().history.map(normalizeHistoryEntryForState).slice(0, HISTORY_LIMIT);

        set({
          isHydrating: true,
          activeUserId: userId,
          statusMessage: undefined,
        });

        const { tasks, history, error } = await fetchUserTaskSnapshot(userId);
        if (loadSequence !== currentLoadSequence) {
          return;
        }

        if (error) {
          set({
            tasks: [],
            history: [],
            isHydrating: false,
            activeUserId: userId,
          });
          showSyncError(set, 'Unable to load your tasks from the secure database.');
          return;
        }

        if (tasks.length === 0 && history.length === 0 && (localTasks.length > 0 || localHistory.length > 0)) {
          const taskSyncErrors = await Promise.all(
            localTasks.map((task) => insertTaskRecord(userId, task))
          );
          const historySyncErrors = await Promise.all(
            localHistory.map((entry) =>
              insertHistoryRecord(userId, entry, {
                taskId: entry.taskId ?? null,
                source: entry.source ?? 'task',
              })
            )
          );
          if (loadSequence !== currentLoadSequence) {
            return;
          }

          set({
            tasks: localTasks,
            history: localHistory,
            isHydrating: false,
            activeUserId: userId,
          });

          if (
            taskSyncErrors.some((syncError) => Boolean(syncError)) ||
            historySyncErrors.some((syncError) => Boolean(syncError))
          ) {
            showSyncError(set, 'Some local task data could not sync to cloud yet.');
          }
          return;
        }

        set({
          tasks,
          history: history.slice(0, HISTORY_LIMIT),
          isHydrating: false,
          activeUserId: userId,
        });
      },

      resetUserData: () => {
        currentLoadSequence += 1;
        set({
          tasks: [],
          history: [],
          filter: 'all',
          statusMessage: undefined,
          activeUserId: null,
          isHydrating: false,
        });
      },

      addTask: (title, description, priority, dueAt = null, restMinutes = null) => {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title,
          description,
          completed: false,
          completedAt: null,
          dueAt,
          restMinutes,
          priority,
          createdAt: new Date(),
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        const userId = getCurrentUserId();
        if (!userId) {
          return;
        }

        void insertTaskRecord(userId, newTask).then((error) => {
          if (error) {
            showSyncError(set);
          }
        });
      },

      toggleTask: (id) => {
        const userId = getCurrentUserId();
        const currentTask = get().tasks.find((task) => task.id === id);
        if (!currentTask) {
          return;
        }

        const now = new Date();
        const completed = !currentTask.completed;
        const toggledTask: Task = {
          ...currentTask,
          completed,
          completedAt: completed ? now : null,
        };
        const historyEntry: HistoryEntry | null = completed
          ? {
              id: crypto.randomUUID(),
              taskId: currentTask.id,
              source: 'task',
              title: currentTask.title,
              description: currentTask.description,
              priority: currentTask.priority,
              createdAt: toIsoString(currentTask.createdAt),
              completedAt: now.toISOString(),
            }
          : null;

        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? toggledTask : task)),
          history: historyEntry ? [historyEntry, ...state.history].slice(0, HISTORY_LIMIT) : state.history,
          statusMessage: completed ? 'Task marked as completed' : 'Task moved back to active tasks',
        }));

        // clear message after a short delay
        setTimeout(() => {
          set({ statusMessage: undefined });
        }, 2000);

        if (!userId) {
          return;
        }

        void (async () => {
          const [taskError, historyError] = await Promise.all([
            updateTaskRecord(userId, id, {
              completed: toggledTask.completed,
              completedAt: toggledTask.completed ? toggledTask.completedAt ?? new Date() : null,
            }),
            historyEntry
              ? insertHistoryRecord(userId, historyEntry, {
                  taskId: historyEntry.taskId ?? id,
                  source: 'task',
                })
              : Promise.resolve(null),
          ]);

          if (taskError || historyError) {
            showSyncError(set);
          }
        })();
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));

        const userId = getCurrentUserId();
        if (!userId) {
          return;
        }

        void deleteTaskRecord(userId, id).then((error) => {
          if (error) {
            showSyncError(set);
          }
        });
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));

        const userId = getCurrentUserId();
        if (!userId) {
          return;
        }

        void updateTaskRecord(userId, id, updates).then((error) => {
          if (error) {
            showSyncError(set);
          }
        });
      },

      setFilter: (filter) => {
        set({ filter });
      },

      clearCompleted: () => {
        const completedCount = get().tasks.filter((task) => task.completed).length;
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed),
        }));

        const userId = getCurrentUserId();
        if (!userId || completedCount === 0) {
          return;
        }

        void clearCompletedTaskRecords(userId).then((error) => {
          if (error) {
            showSyncError(set);
          }
        });
      },

      addHistoryEntry: (entry, options) => {
        const normalizedEntry: HistoryEntry = {
          ...entry,
          taskId: options?.taskId ?? entry.taskId ?? null,
          source: options?.source ?? entry.source ?? 'task',
          createdAt: toIsoString(entry.createdAt),
          completedAt: toIsoString(entry.completedAt),
        };

        set((state) => ({
          history: [normalizedEntry, ...state.history].slice(0, HISTORY_LIMIT),
        }));

        const userId = getCurrentUserId();
        if (!userId) {
          return;
        }

        void insertHistoryRecord(userId, normalizedEntry, {
          taskId: normalizedEntry.taskId ?? null,
          source: normalizedEntry.source,
        }).then((error) => {
          if (error) {
            showSyncError(set);
          }
        });
      },

      setStatusMessage: (msg) => set({ statusMessage: msg }),
    }),
    {
      name: 'task-storage',
      version: 3,
      partialize: (state) => ({
        filter: state.filter,
      }),
      migrate: (persisted: unknown) => {
        const state = (persisted ?? {}) as LegacyPersistedTaskState;
        const nextState: Partial<TaskState> = {
          filter:
            state.filter === 'all' || state.filter === 'active' || state.filter === 'completed'
              ? state.filter
              : 'all',
        };

        if (Array.isArray(state.tasks)) {
          nextState.tasks = state.tasks.map((task) => normalizeTaskForState(task as Task));
        }

        if (Array.isArray(state.history)) {
          nextState.history = state.history
            .map((entry) => normalizeHistoryEntryForState(entry as HistoryEntry))
            .slice(0, HISTORY_LIMIT);
        }

        return nextState;
      },
    }
  )
);
