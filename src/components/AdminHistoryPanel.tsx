import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, ShieldAlert, Users } from 'lucide-react';
import {
  checkTaskAdminAccess,
  fetchAdminUserHistory,
  fetchAdminUserSummaries,
  type AdminHistoryEntry,
  type AdminUserSummary,
} from '@/lib/taskDatabase';
import { useAuthStore } from '@/store/authStore';

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleString();
};

export function AdminHistoryPanel() {
  const currentUserId = useAuthStore((state) => state.user?.id ?? '');
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = async (userId: string) => {
    setHistoryLoading(true);
    const { history: rows, error } = await fetchAdminUserHistory(userId);
    if (error) {
      setErrorMessage(error);
      setHistory([]);
      setHistoryLoading(false);
      return;
    }
    setHistory(rows);
    setHistoryLoading(false);
  };

  const loadUsers = async (shouldAutoSelect = true) => {
    setUsersLoading(true);
    const { users: rows, error } = await fetchAdminUserSummaries();
    if (error) {
      setErrorMessage(error);
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    setUsers(rows);
    setUsersLoading(false);

    if (!shouldAutoSelect) {
      return;
    }

    const hasExisting = selectedUserId && rows.some((item) => item.userId === selectedUserId);
    const nextUserId = hasExisting ? selectedUserId : rows[0]?.userId;
    if (!nextUserId) {
      setSelectedUserId(null);
      setHistory([]);
      return;
    }

    setSelectedUserId(nextUserId);
    await loadHistory(nextUserId);
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setCheckingAccess(true);
      setAccessError(null);
      setErrorMessage(null);

      const { isAdmin: allowed, error } = await checkTaskAdminAccess();
      if (!active) {
        return;
      }

      if (error) {
        setAccessError(error);
      }
      setIsAdmin(allowed);
      setCheckingAccess(false);

      if (allowed) {
        setUsersLoading(true);
        const { users: rows, error: usersError } = await fetchAdminUserSummaries();
        if (!active) {
          return;
        }
        if (usersError) {
          setErrorMessage(usersError);
          setUsers([]);
          setUsersLoading(false);
          return;
        }

        setUsers(rows);
        setUsersLoading(false);

        const nextUserId = rows[0]?.userId;
        if (!nextUserId) {
          setSelectedUserId(null);
          setHistory([]);
          return;
        }

        setSelectedUserId(nextUserId);
        setHistoryLoading(true);
        const { history: historyRows, error: historyError } = await fetchAdminUserHistory(nextUserId);
        if (!active) {
          return;
        }
        if (historyError) {
          setErrorMessage(historyError);
          setHistory([]);
          setHistoryLoading(false);
          return;
        }
        setHistory(historyRows);
        setHistoryLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return users;
    }
    return users.filter((user) => user.userId.toLowerCase().includes(query));
  }, [search, users]);

  if (checkingAccess) {
    return (
      <div className="rounded-2xl border border-sky-200/70 bg-white/90 px-4 py-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-700" />
        <p className="mt-2 text-sm text-slate-600">Checking admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-6 text-rose-800 shadow-sm">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Admin access required</p>
            <p className="mt-1 text-sm">Only admin users can view all users and full history.</p>
            {currentUserId && (
              <div className="mt-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs">
                <p className="font-semibold">Current user ID</p>
                <p className="mt-1 break-all">{currentUserId}</p>
                <p className="mt-2">Run in SQL Editor:</p>
                <code className="mt-1 block break-all rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700">
                  insert into public.admin_users (user_id) values ('{currentUserId}') on conflict (user_id) do nothing;
                </code>
              </div>
            )}
            {accessError && <p className="mt-2 text-xs">{accessError}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-sky-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.95)_0%,rgba(239,246,255,0.92)_100%)] p-5 shadow-[0_20px_40px_rgba(14,165,233,0.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Admin</p>
          <h3 className="text-xl font-semibold text-slate-900">Users And Task History</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadUsers(false);
            if (selectedUserId) {
              void loadHistory(selectedUserId);
            }
          }}
          className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-50"
        >
          Refresh
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-2xl border border-cyan-200/70 bg-white/85 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-full border border-cyan-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="max-h-[520px] space-y-2 overflow-y-auto">
            {usersLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users...
              </div>
            )}

            {!usersLoading && filteredUsers.length === 0 && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                No users found.
              </p>
            )}

            {!usersLoading &&
              filteredUsers.map((user) => {
                const selected = user.userId === selectedUserId;
                return (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(user.userId);
                      void loadHistory(user.userId);
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      selected
                        ? 'border-cyan-300 bg-cyan-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="truncate text-xs font-semibold text-slate-900">{user.userId}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                      <span>Open {user.openTasks}</span>
                      <span>Done {user.completedTasks}</span>
                      <span>History {user.historyEntries}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Last completed: {formatDateTime(user.lastCompletedAt)}
                    </p>
                  </button>
                );
              })}
          </div>
        </aside>

        <div className="rounded-2xl border border-cyan-200/70 bg-white/85 p-3">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-700" />
            <p className="text-sm font-semibold text-slate-800">
              {selectedUserId ? `History for ${selectedUserId}` : 'Select a user ID'}
            </p>
          </div>

          {historyLoading && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading history...
            </div>
          )}

          {!historyLoading && selectedUserId && history.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              No history entries for this user.
            </p>
          )}

          {!historyLoading && history.length > 0 && (
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {entry.source}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {entry.priority}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="mt-1 text-xs text-slate-600">{entry.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                    <span>Started: {formatDateTime(entry.createdAt)}</span>
                    <span>Completed: {formatDateTime(entry.completedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminHistoryPanel;
