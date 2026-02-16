import { useEffect, useState } from 'react';
import { Plus, Check, Clock, Search, Calendar, Trash2 } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import type { HistoryEntry } from '@/types/task';

type TableRow = {
  id: string;
  time: string;
  task: string;
  selected: boolean;
};

type TaskTable = {
  id: string;
  title: string;
  createdAt: string;
  notifyDate: string;
  notifyDaily: boolean;
  notifyEmail: boolean;
  isSaved: boolean;
  rows: TableRow[];
};

const TABLES_STORAGE_KEY = 'schedule-board-tables-v1';
const ACTIVE_TABLE_STORAGE_KEY = 'schedule-board-active-table-v1';

const createDefaultRow = (): TableRow => ({
  id: crypto.randomUUID(),
  time: '',
  task: '',
  selected: false,
});

const loadTables = (): TaskTable[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(TABLES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as TaskTable[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }

    // Only expose tables that were explicitly saved by the user.
    return parsed
      .filter((table) => table.isSaved)
      .map((table) => ({
        ...table,
        createdAt: table.createdAt || new Date().toISOString(),
        rows: Array.isArray(table.rows) && table.rows.length > 0 ? table.rows : [createDefaultRow()],
      }));
  } catch {
    return [];
  }
};

const loadActiveId = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return localStorage.getItem(ACTIVE_TABLE_STORAGE_KEY) ?? '';
};

type ScheduleBoardProps = {
  /** Minimal mode hides chips and table editor, leaving header, search/add, and save actions. */
  minimal?: boolean;
};

export function ScheduleBoard({ minimal = false }: ScheduleBoardProps) {
  const [tables, setTables] = useState<TaskTable[]>(loadTables);
  const [activeId, setActiveId] = useState<string>(loadActiveId);
  const [search, setSearch] = useState('');
  const [saveNote, setSaveNote] = useState('');
  const [errorNote, setErrorNote] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const addHistoryEntry = useTaskStore((s) => s.addHistoryEntry);
  const setStatusMessage = useTaskStore((s) => s.setStatusMessage);

  const current = tables.find((t) => t.id === activeId) ?? tables[0];
  const currentId = current?.id ?? '';
  const showSelection = minimal; // only show tick boxes in Tables view

  const filteredTables = tables.filter(
    (t) => t.isSaved && t.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  const progress = current
    ? {
        total: current.rows.length,
        completed: current.rows.filter((r) => r.selected).length,
      }
    : { total: 0, completed: 0 };
  const progressPct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  useEffect(() => {
    localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));

    if (tables.length > 0 && (!activeId || !tables.some((t) => t.id === activeId))) {
      setActiveId(tables[0].id);
    }

    if (tables.length === 0 && activeId) {
      setActiveId('');
    }
  }, [tables, activeId]);

  useEffect(() => {
    if (!activeId) {
      return;
    }
    localStorage.setItem(ACTIVE_TABLE_STORAGE_KEY, activeId);
  }, [activeId]);

  const updateRow = (rowId: string, patch: Partial<TableRow>) => {
    const selectionOnlyPatch =
      Object.keys(patch).length === 1 && Object.prototype.hasOwnProperty.call(patch, 'selected');

    const wasSelected = patch.selected === true && current?.rows.find((r) => r.id === rowId)?.selected !== true;

    setTables((prev) =>
      prev.map((table) =>
        table.id === currentId
          ? {
              ...table,
              // Editing task/time requires re-save. Row selection should remain available after save.
              isSaved: selectionOnlyPatch ? table.isSaved : false,
              rows: table.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
            }
          : table
      )
    );

    if (wasSelected && current) {
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        title: current.title || 'Table task',
        description: `Row marked done${current.notifyDate ? ` - Notify ${current.notifyDate}` : ''}`,
        priority: 'low',
        createdAt: new Date(current.createdAt || Date.now()).toISOString(),
        completedAt: new Date().toISOString(),
      };
      addHistoryEntry(entry);
      setStatusMessage('Task marked as completed');
      setTimeout(() => setStatusMessage(undefined), 2000);
    }
  };

  const updateTable = (patch: Partial<TaskTable>) => {
    setTables((prev) =>
      prev.map((t) => (t.id === currentId ? { ...t, ...patch, isSaved: false } : t))
    );
  };

  const removeRow = (rowId: string) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === currentId
          ? {
              ...table,
              isSaved: false,
              rows: table.rows.length > 1 ? table.rows.filter((r) => r.id !== rowId) : table.rows,
            }
          : table
      )
    );
  };

  const updateTableTitle = (value: string) => {
    const normalized = value.trim().toLowerCase();
    const duplicate = tables.some(
      (t) => t.id !== currentId && t.title.trim().toLowerCase() === normalized && normalized.length > 0
    );
    if (duplicate) {
      setSaveNote('Table name must be unique.');
      setTimeout(() => setSaveNote(''), 2000);
      return;
    }
    updateTable({ title: value });
  };

  const addRow = () => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === currentId
          ? {
              ...table,
              isSaved: false,
              rows: [...table.rows, { id: crypto.randomUUID(), time: '', task: '', selected: false }],
            }
          : table
      )
    );
  };

  const nextTableName = () => {
    const base = 'Table';
    let idx = tables.length + 1;
    let nextName = `${base} ${idx}`;
    const names = new Set(tables.map((t) => t.title.trim().toLowerCase()));
    while (names.has(nextName.toLowerCase())) {
      idx += 1;
      nextName = `${base} ${idx}`;
    }
    return nextName;
  };

  const addTable = () => {
    const nextName = nextTableName();

    const id = crypto.randomUUID();
    const next: TaskTable = {
      id,
      title: nextName,
      createdAt: new Date().toISOString(),
      notifyDate: '',
      notifyDaily: false,
      notifyEmail: false,
      isSaved: false,
      rows: [{ id: crypto.randomUUID(), time: '', task: '', selected: false }],
    };
    setTables((prev) => [...prev, next]);
    setActiveId(id);
    setShowDetails(true);
  };

  const addFreshBlankTable = () => {
    const nextName = nextTableName();
    const id = crypto.randomUUID();
    const blank: TaskTable = {
      id,
      title: nextName,
      createdAt: new Date().toISOString(),
      notifyDate: '',
      notifyDaily: false,
      notifyEmail: false,
      isSaved: false,
      rows: [createDefaultRow()],
    };
    setTables((prev) => [...prev, blank]);
    setActiveId(id);
    setShowDetails(true);
    setSearch('');
  };

  const onSave = () => {
    if (!current) return;
    if (!current.notifyDate) {
      setErrorNote('Please enter a notify date before saving.');
      setTimeout(() => setErrorNote(''), 2500);
      return;
    }
    setErrorNote('');

    const cleanedRows = current.rows.map((r) => ({
      ...r,
      // ensure each row always has a select box preserved
      selected: Boolean(r.selected),
    }));
    const nonEmpty = cleanedRows.filter(
      (r) => (r.time && r.time.trim().length > 0) || (r.task && r.task.trim().length > 0)
    );
    const nextRows = nonEmpty.length > 0 ? nonEmpty : [createDefaultRow()];

    setTables((prev) =>
      prev.map((t) =>
        t.id === currentId
          ? {
              ...t,
              rows: nextRows,
              isSaved: true,
            }
          : t
      )
    );
    setSaveNote('Table saved successfully. Your tasks are now scheduled.');
    setTimeout(() => setSaveNote(''), 2500);

    if (!minimal) {
      addFreshBlankTable();
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-cyan-200/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.95)_0%,rgba(240,249,255,0.92)_58%,rgba(236,254,255,0.9)_100%)] p-6 shadow-[0_20px_40px_rgba(14,165,233,0.14)]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Structured tables</p>
            <h3 className="bg-gradient-to-r from-slate-900 via-cyan-800 to-teal-800 bg-clip-text text-2xl font-semibold text-transparent">
              Schedule your tasks
            </h3>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {minimal && (
              <div className="relative w-full sm:w-auto">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search table name"
                  className="h-12 w-full rounded-full border border-cyan-200 bg-white/95 pl-12 pr-4 text-base text-slate-700 placeholder:text-slate-400 shadow-inner focus:border-cyan-400 focus:outline-none sm:w-72 sm:text-lg"
                />
              </div>
            )}
            {!minimal && (
              <button
                type="button"
                onClick={addTable}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(14,165,233,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(14,165,233,0.35)]"
              >
                <Plus className="h-4 w-4" />
                Add table
              </button>
            )}
          </div>
        </div>
        {minimal && showDetails && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowDetails(false)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/85 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              Back
            </button>
          </div>
        )}
      </div>

      {errorNote && (
        <div className="w-fit rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm">
          {errorNote}
        </div>
      )}

      {saveNote && (
        <div className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
          {saveNote}
        </div>
      )}

      {/* Hide saved-table chips in Tasks view; Tables view already lists saved tables. */}

      {minimal && !showDetails && (
        <div className="grid gap-3">
          {filteredTables.length > 0 ? (
            filteredTables.map((table) => {
              const total = table.rows.length;
              const completed = table.rows.filter((r) => r.selected).length;
              const createdLabel = table.createdAt ? new Date(table.createdAt).toLocaleDateString() : '--';
              const notifyLabel = table.notifyDate || '--';
              return (
                <button
                  key={table.id}
                  onClick={() => {
                    setActiveId(table.id);
                    setShowDetails(true);
                  }}
                  className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-[linear-gradient(130deg,#eff6ff_0%,#ecfeff_100%)] px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(14,165,233,0.14)]"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Table</p>
                    <p className="text-lg font-semibold text-slate-900">{table.title}</p>
                    <p className="text-sm text-slate-600">Created {createdLabel}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
                    <span>Total: {total}</span>
                    <span>Completed: {completed}</span>
                    <span>Notify: {notifyLabel}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">No saved tables yet.</p>
          )}
        </div>
      )}

      {(!minimal || showDetails) && current && (
        <div className={`flex ${minimal ? 'justify-center items-start' : ''}`}>
          <div
            className={`overflow-hidden rounded-2xl border border-cyan-200/70 bg-white/95 shadow-[0_14px_30px_rgba(14,165,233,0.12)] ${
              minimal ? 'w-full max-w-4xl' : 'w-full'
            }`}
          >
          <div className="flex flex-wrap items-center gap-3 px-4 pt-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Progress</p>
              <div className="flex w-full flex-wrap items-center gap-3">
                <div className="h-2 w-full max-w-[16rem] rounded-full bg-sky-100">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: progress.completed === progress.total && progress.total > 0 ? '#10B981' : '#0EA5E9',
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {progress.completed} of {progress.total} tasks completed
                </span>
              </div>
              {progress.total > 0 && progress.completed === progress.total && (
                <span className="text-xs font-semibold text-emerald-700">
                  All tasks in this table are completed
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3 border-b border-cyan-100 px-4 py-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Table name</label>
              <input
                type="text"
                value={current.title}
                onChange={(e) => updateTableTitle(e.target.value)}
                readOnly={minimal}
                className="w-full rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-inner focus:border-cyan-400 focus:outline-none sm:w-56"
              />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
                Notify date
                <div className="relative mt-1 rounded-full border border-cyan-200 bg-white px-3 py-2 shadow-inner">
                  <input
                    type="date"
                    value={current.notifyDate}
                    onChange={(e) => updateTable({ notifyDate: e.target.value })}
                    readOnly={minimal}
                    disabled={minimal}
                    className="hide-native-picker w-full bg-transparent pr-8 text-sm text-slate-900 focus:outline-none"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={current.notifyDaily}
                  title={
                    current.notifyDaily
                      ? 'Reminder enabled. You will be notified at the scheduled time.'
                      : 'No reminder set. Turn on notifications to receive alerts.'
                  }
                    onChange={(e) => {
                      updateTable({ notifyDaily: e.target.checked });
                      setStatusMessage(e.target.checked ? 'Notifications turned on' : 'Notifications turned off');
                      setTimeout(() => setStatusMessage(undefined), 2000);
                    }}
                    disabled={minimal}
                    className="h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-400 disabled:opacity-60"
                  />
                Every day
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={current.notifyEmail}
                  title={
                    current.notifyEmail
                      ? 'Reminder enabled. You will be notified at the scheduled time.'
                      : 'No reminder set. Turn on notifications to receive alerts.'
                  }
                    onChange={(e) => {
                      updateTable({ notifyEmail: e.target.checked });
                      setStatusMessage(e.target.checked ? 'Notifications turned on' : 'Notifications turned off');
                      setTimeout(() => setStatusMessage(undefined), 2000);
                    }}
                    disabled={minimal}
                    className="h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-400 disabled:opacity-60"
                  />
                Notify by email
              </label>
            </div>
            {!minimal && (
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(14,165,233,0.34)]"
                >
                  <Plus className="h-4 w-4" />
                  Add row
                </button>
              </div>
            )}
          </div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="bg-[linear-gradient(120deg,#eff6ff_0%,#ecfeff_100%)] text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
                <tr>
                  {showSelection && <th className="px-3 py-3 text-left">Select</th>}
                  <th className="px-3 py-3 text-left">No</th>
                  <th className="px-3 py-3 text-left">Time</th>
                  <th className="px-3 py-3 text-left">Task to perform</th>
                  {!minimal && <th className="px-3 py-3 text-left">Delete</th>}
                </tr>
              </thead>
              <tbody>
                {current.rows.map((row, idx) => (
                  <tr key={row.id} className="border-t border-cyan-100/80 transition-colors hover:bg-cyan-50/30">
                    {showSelection && (
                      <td className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          disabled={row.selected}
                          onChange={() => {
                            if (row.selected) return;
                            updateRow(row.id, { selected: true });
                          }}
                          className="h-4 w-4 rounded border-cyan-300 text-cyan-700 focus:ring-cyan-400 disabled:opacity-60"
                        />
                      </td>
                    )}
                      <td className={`px-3 py-3 text-sm font-semibold ${row.selected ? 'text-slate-400' : 'text-slate-900'}`}>{idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="relative">
                        <input
                          type="time"
                          value={row.time}
                          placeholder="--:--"
                          onChange={(e) => updateRow(row.id, { time: e.target.value })}
                          readOnly={minimal}
                          disabled={minimal}
                          className={`hide-native-picker w-full rounded-full border border-cyan-200 bg-white px-4 py-2 pr-10 text-sm shadow-inner focus:border-cyan-400 focus:outline-none disabled:text-slate-400 ${
                            row.selected ? 'text-slate-400 line-through' : 'text-slate-900'
                          }`}
                        />
                        <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={row.task}
                        onChange={(e) => updateRow(row.id, { task: e.target.value })}
                        placeholder="What to perform"
                        readOnly={minimal}
                        disabled={minimal}
                        className={`w-full rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm shadow-inner focus:border-cyan-400 focus:outline-none disabled:text-slate-400 ${
                          row.selected ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}
                      />
                    </td>
                    {!minimal && (
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
                          aria-label="Delete row"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {!minimal && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(14,165,233,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(14,165,233,0.35)]"
          >
            <Check className="h-4 w-4" />
            Save Table
          </button>
          {!current?.isSaved && (
            <span className="text-sm font-semibold text-amber-700">
              Save table to enable row selection.
            </span>
          )}
        </div>
      )}
    </section>
  );
}

export default ScheduleBoard;
