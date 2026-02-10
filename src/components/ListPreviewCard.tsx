import { CheckCircle2, Circle, UserPlus } from 'lucide-react';

const sampleTasks = [
  { text: 'Marketing strategy', done: false },
  { text: 'Design system update', done: false },
  { text: 'Website design & dev', done: false },
  { text: 'Pricing strategy', done: true },
  { text: 'Prepare analytics', done: false },
];

export function ListPreviewCard() {
  return (
    <div className="flex max-w-md flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((id) => (
            <span
              key={id}
              className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-orange-400 to-pink-500"
              aria-hidden
            />
          ))}
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-semibold text-slate-600">
            +6
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <UserPlus className="h-3.5 w-3.5" />
          Team
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900">App Launch</h3>
        <p className="mt-1 text-sm text-slate-600">
          Quick recap of what we&apos;re working on. Add notes or details to the tasks.
        </p>
      </div>

      <ul className="space-y-2">
        {sampleTasks.map((task) => (
          <li key={task.text} className="flex items-start gap-2 text-sm text-slate-800">
            {task.done ? (
              <CheckCircle2 className="mt-[2px] h-4 w-4 text-[var(--brand,#ff4d37)]" />
            ) : (
              <Circle className="mt-[2px] h-4 w-4 text-slate-400" />
            )}
            <span className={task.done ? 'line-through text-slate-400' : ''}>{task.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListPreviewCard;
