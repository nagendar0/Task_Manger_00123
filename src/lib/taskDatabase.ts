import { insforge, isInsforgeConfigured } from '@/lib/insforge';
import type { HistoryEntry, HistorySource, Task, TaskPriority } from '@/types/task';

const HISTORY_LIMIT = 500;

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: string;
  due_at: string | null;
  rest_minutes: number | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

type HistoryRow = {
  id: string;
  user_id: string;
  task_id: string | null;
  source: string;
  title: string;
  description: string;
  priority: string;
  created_at: string;
  completed_at: string;
};

type AdminUserSummaryRow = {
  user_id: string;
  open_tasks: number;
  completed_tasks: number;
  history_entries: number;
  last_completed_at: string | null;
};

type AdminHistoryRow = {
  id: string;
  user_id: string;
  task_id: string | null;
  source: string;
  title: string;
  description: string;
  priority: string;
  created_at: string;
  completed_at: string;
  logged_at: string;
};

export type AdminUserSummary = {
  userId: string;
  openTasks: number;
  completedTasks: number;
  historyEntries: number;
  lastCompletedAt: string | null;
};

export type AdminHistoryEntry = HistoryEntry & {
  userId: string;
  loggedAt: string;
};

const normalizePriority = (value: string | null | undefined): TaskPriority => {
  if (value === 'low' || value === 'high' || value === 'medium') {
    return value;
  }
  return 'medium';
};

const normalizeSource = (value: string | null | undefined): HistorySource =>
  value === 'table' ? 'table' : 'task';

const toIsoString = (value: Date | string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
};

const toRequiredIsoString = (value: string | null | undefined): string => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};

const toDate = (value: string | null | undefined): Date => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

const isDatabaseReady = () => Boolean(insforge && isInsforgeConfigured);

const toTaskRowInsert = (userId: string, task: Task) => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  description: task.description || '',
  priority: task.priority,
  due_at: toIsoString(task.dueAt),
  rest_minutes: typeof task.restMinutes === 'number' ? task.restMinutes : null,
  completed: Boolean(task.completed),
  completed_at: toIsoString(task.completedAt),
  created_at: toIsoString(task.createdAt) || new Date().toISOString(),
});

const mapTaskRow = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title || '',
  description: row.description || '',
  priority: normalizePriority(row.priority),
  dueAt: toIsoString(row.due_at),
  restMinutes: typeof row.rest_minutes === 'number' ? row.rest_minutes : null,
  completed: Boolean(row.completed),
  completedAt: toIsoString(row.completed_at),
  createdAt: toDate(row.created_at),
});

const mapHistoryRow = (row: HistoryRow): HistoryEntry => ({
  id: row.id,
  taskId: row.task_id,
  source: normalizeSource(row.source),
  title: row.title || '',
  description: row.description || '',
  priority: normalizePriority(row.priority),
  createdAt: toRequiredIsoString(row.created_at),
  completedAt: toRequiredIsoString(row.completed_at),
});

const mapAdminUserSummaryRow = (row: AdminUserSummaryRow): AdminUserSummary => ({
  userId: row.user_id,
  openTasks: Number(row.open_tasks) || 0,
  completedTasks: Number(row.completed_tasks) || 0,
  historyEntries: Number(row.history_entries) || 0,
  lastCompletedAt: row.last_completed_at ? toRequiredIsoString(row.last_completed_at) : null,
});

const mapAdminHistoryRow = (row: AdminHistoryRow): AdminHistoryEntry => ({
  id: row.id,
  userId: row.user_id,
  taskId: row.task_id,
  source: normalizeSource(row.source),
  title: row.title || '',
  description: row.description || '',
  priority: normalizePriority(row.priority),
  createdAt: toRequiredIsoString(row.created_at),
  completedAt: toRequiredIsoString(row.completed_at),
  loggedAt: toRequiredIsoString(row.logged_at),
});

const errorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const fetchUserTaskSnapshot = async (
  userId: string
): Promise<{ tasks: Task[]; history: HistoryEntry[]; error: string | null }> => {
  if (!isDatabaseReady()) {
    return { tasks: [], history: [], error: null };
  }

  try {
    const client = insforge!;
    const [taskResult, historyResult] = await Promise.all([
      client.database
        .from('user_tasks')
        .select('id,user_id,title,description,priority,due_at,rest_minutes,completed,completed_at,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      client.database
        .from('task_history')
        .select('id,user_id,task_id,source,title,description,priority,created_at,completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(HISTORY_LIMIT),
    ]);

    if (taskResult.error || historyResult.error) {
      return {
        tasks: [],
        history: [],
        error:
          taskResult.error?.message ||
          historyResult.error?.message ||
          'Unable to load task data from database.',
      };
    }

    const tasks = ((taskResult.data || []) as TaskRow[]).map(mapTaskRow);
    const history = ((historyResult.data || []) as HistoryRow[]).map(mapHistoryRow);
    return { tasks, history, error: null };
  } catch (error) {
    return { tasks: [], history: [], error: errorMessage(error, 'Unable to load task data from database.') };
  }
};

export const insertTaskRecord = async (userId: string, task: Task): Promise<string | null> => {
  if (!isDatabaseReady()) {
    return null;
  }

  try {
    const { error } = await insforge!.database.from('user_tasks').insert(toTaskRowInsert(userId, task));
    return error?.message || null;
  } catch (error) {
    return errorMessage(error, 'Unable to save task to database.');
  }
};

export const updateTaskRecord = async (
  userId: string,
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<string | null> => {
  if (!isDatabaseReady()) {
    return null;
  }

  const payload: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(updates, 'title') && typeof updates.title === 'string') {
    payload.title = updates.title;
  }
  if (
    Object.prototype.hasOwnProperty.call(updates, 'description') &&
    typeof updates.description === 'string'
  ) {
    payload.description = updates.description;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'priority')) {
    payload.priority = normalizePriority(updates.priority as string | null | undefined);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'dueAt')) {
    payload.due_at = toIsoString(updates.dueAt);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'restMinutes')) {
    payload.rest_minutes =
      typeof updates.restMinutes === 'number' && updates.restMinutes > 0 ? updates.restMinutes : null;
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'completed')) {
    payload.completed = Boolean(updates.completed);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'completedAt')) {
    payload.completed_at = toIsoString(updates.completedAt);
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  try {
    const { error } = await insforge!.database
      .from('user_tasks')
      .update(payload)
      .eq('id', taskId)
      .eq('user_id', userId);
    return error?.message || null;
  } catch (error) {
    return errorMessage(error, 'Unable to update task in database.');
  }
};

export const deleteTaskRecord = async (userId: string, taskId: string): Promise<string | null> => {
  if (!isDatabaseReady()) {
    return null;
  }

  try {
    const { error } = await insforge!.database
      .from('user_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);
    return error?.message || null;
  } catch (error) {
    return errorMessage(error, 'Unable to delete task from database.');
  }
};

export const clearCompletedTaskRecords = async (userId: string): Promise<string | null> => {
  if (!isDatabaseReady()) {
    return null;
  }

  try {
    const { error } = await insforge!.database
      .from('user_tasks')
      .delete()
      .eq('user_id', userId)
      .eq('completed', true);
    return error?.message || null;
  } catch (error) {
    return errorMessage(error, 'Unable to clear completed tasks from database.');
  }
};

type InsertHistoryOptions = {
  taskId?: string | null;
  source?: HistorySource;
};

export const insertHistoryRecord = async (
  userId: string,
  entry: HistoryEntry,
  options?: InsertHistoryOptions
): Promise<string | null> => {
  if (!isDatabaseReady()) {
    return null;
  }

  const source = options?.source || entry.source || 'task';
  const payload = {
    id: entry.id,
    user_id: userId,
    task_id: options?.taskId ?? entry.taskId ?? null,
    source,
    title: entry.title,
    description: entry.description || '',
    priority: normalizePriority(entry.priority),
    created_at: toRequiredIsoString(entry.createdAt),
    completed_at: toRequiredIsoString(entry.completedAt),
  };

  try {
    const { error } = await insforge!.database.from('task_history').insert(payload);
    return error?.message || null;
  } catch (error) {
    return errorMessage(error, 'Unable to save task history to database.');
  }
};

const parseRpcBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown>;
    const candidate = first?.is_task_admin;
    return candidate === true;
  }
  if (value && typeof value === 'object') {
    const candidate = (value as Record<string, unknown>).is_task_admin;
    return candidate === true;
  }
  return false;
};

export const checkTaskAdminAccess = async (): Promise<{ isAdmin: boolean; error: string | null }> => {
  if (!isDatabaseReady()) {
    return { isAdmin: false, error: null };
  }

  try {
    const { data, error } = await insforge!.database.rpc('is_task_admin');
    if (error) {
      return { isAdmin: false, error: error.message || 'Unable to verify admin access.' };
    }
    return { isAdmin: parseRpcBoolean(data), error: null };
  } catch (error) {
    return { isAdmin: false, error: errorMessage(error, 'Unable to verify admin access.') };
  }
};

export const fetchAdminUserSummaries = async (): Promise<{
  users: AdminUserSummary[];
  error: string | null;
}> => {
  if (!isDatabaseReady()) {
    return { users: [], error: null };
  }

  try {
    const { data, error } = await insforge!.database.rpc('admin_list_task_users');
    if (error) {
      return { users: [], error: error.message || 'Unable to load user list.' };
    }
    const users = ((data || []) as AdminUserSummaryRow[]).map(mapAdminUserSummaryRow);
    return { users, error: null };
  } catch (error) {
    return { users: [], error: errorMessage(error, 'Unable to load user list.') };
  }
};

export const fetchAdminUserHistory = async (
  userId: string
): Promise<{ history: AdminHistoryEntry[]; error: string | null }> => {
  if (!isDatabaseReady()) {
    return { history: [], error: null };
  }

  try {
    const { data, error } = await insforge!.database.rpc('admin_get_user_task_history', {
      target_user_id: userId,
    });
    if (error) {
      return { history: [], error: error.message || 'Unable to load user history.' };
    }
    const history = ((data || []) as AdminHistoryRow[]).map(mapAdminHistoryRow);
    return { history, error: null };
  } catch (error) {
    return { history: [], error: errorMessage(error, 'Unable to load user history.') };
  }
};
