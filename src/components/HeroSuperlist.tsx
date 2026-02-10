import { Button } from '@/components/ui/button';

export function HeroSuperlist() {
  const chips = ['Teamwork', 'Personal projects', 'Everything in between'];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[var(--hero-bg,#f6f1ff)] px-6 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:px-10 sm:py-12">
      <div className="flex flex-col gap-5 max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
          Superlist-inspired
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          Home to all your <span className="text-[var(--brand,#ff4d37)]">lists</span>
        </h1>
        <p className="text-lg text-slate-600">
          For teamwork, personal projects, and everything in between.
        </p>
        <div className="flex flex-wrap gap-3">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
            >
              {chip}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className="rounded-full bg-[var(--brand,#ff4d37)] px-5 text-white hover:bg-[#e63f2d]">
            Join our beta
          </Button>
          <Button variant="outline" className="rounded-full border-slate-200 px-5 text-slate-800 hover:bg-white">
            Visit website
          </Button>
        </div>
      </div>

      <div className="pointer-events-none absolute right-6 top-6 h-56 w-44 rounded-3xl bg-[var(--brand,#ff4d37)] [background:radial-gradient(circle_at_30%_30%,_var(--brand-accent,#5b5bff)_0,_var(--brand-accent,#5b5bff)_30%,_transparent_31%),radial-gradient(circle_at_70%_70%,_var(--brand-accent,#5b5bff)_0,_var(--brand-accent,#5b5bff)_30%,_transparent_31%)] opacity-90" />
    </section>
  );
}

export default HeroSuperlist;
