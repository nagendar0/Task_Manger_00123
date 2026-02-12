import { useState } from 'react';
import {
  ArrowRight,
  Clock3,
  Chrome,
  Eye,
  EyeOff,
  Github,
  Layers,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/authStore';
import NeuralBackground from '@/components/ui/flow-field-background';

type AuthMode = 'signin' | 'signup';

const primaryActionClass =
  'group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff5b41] to-[#ff7a4e] px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(255,91,65,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(255,91,65,0.42)] disabled:pointer-events-none disabled:opacity-60';

const tagClass =
  'rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600';

const appName = 'YourApp';

type SlideTag = {
  label: string;
  className: string;
  positionClass: string;
};

type FeatureSlide = {
  id: string;
  accentTitle: string;
  title: string;
  accentClass: string;
  leftPanelClass: string;
  rightPanelClass: string;
  cardTitle: string;
  cardItems: string[];
  tags: SlideTag[];
};

const featureSlides: FeatureSlide[] = [
  {
    id: 'tasks-notes',
    accentTitle: 'Tasks, notes',
    title: '& everything in between.',
    accentClass: 'text-[#665de7]',
    leftPanelClass: 'bg-[#eff0f5]',
    rightPanelClass: 'bg-[#665de7]',
    cardTitle: 'Daily To-do',
    cardItems: [
      'Daily design check-in',
      'Revise the user flow',
      'Prepare branding assets',
      'Write sprint notes',
    ],
    tags: [
      { label: 'Tasks', className: 'bg-[#ff5b41] text-white', positionClass: 'right-[-14px] top-8' },
      { label: 'Integrations', className: 'bg-[#1ea970] text-white', positionClass: 'right-[-20px] top-1/2' },
      { label: 'Images', className: 'bg-[#2d9cf0] text-white', positionClass: 'left-4 bottom-4' },
    ],
  },
  {
    id: 'integrations',
    accentTitle: 'Integrated',
    title: 'with apps you love.',
    accentClass: 'text-[#1c9a74]',
    leftPanelClass: 'bg-[#edf1f4]',
    rightPanelClass: 'bg-[#1d9a74]',
    cardTitle: 'Daily Tasks',
    cardItems: [
      "Respond to Jim's email",
      "Review Amy's pull request",
      'Prepare app designs',
      "Watch Hannah's Loom",
    ],
    tags: [
      { label: 'Figma', className: 'bg-white/90 text-slate-800', positionClass: 'left-8 top-8' },
      { label: 'GitHub', className: 'bg-white/90 text-slate-800', positionClass: 'right-6 top-10' },
      { label: 'Calendar', className: 'bg-white/90 text-slate-800', positionClass: 'right-10 bottom-8' },
    ],
  },
  {
    id: 'work-personal',
    accentTitle: 'Work & personal',
    title: 'at the flip of a switch.',
    accentClass: 'text-[#ff5b41]',
    leftPanelClass: 'bg-[#f7ecec]',
    rightPanelClass: 'bg-[#ff5b41]',
    cardTitle: 'Inbox',
    cardItems: [
      'Grocery shopping',
      'Yoga class',
      'Water the plants',
      'Plan weekend trip',
    ],
    tags: [
      { label: 'Personal', className: 'bg-white text-slate-900', positionClass: 'left-8 bottom-16' },
      { label: 'Work', className: 'bg-white text-slate-900', positionClass: 'left-8 bottom-8' },
    ],
  },
  {
    id: 'teams-solo',
    accentTitle: 'Perfect for',
    title: 'teams and solo users.',
    accentClass: 'text-[#2f94e8]',
    leftPanelClass: 'bg-[#edf3fa]',
    rightPanelClass: 'bg-[#2f94e8]',
    cardTitle: 'Acme Co',
    cardItems: [
      'Sprint planning',
      'Q1 goals',
      'Friday sync',
      'Roadmap notes',
    ],
    tags: [
      { label: 'Shion', className: 'bg-[#f14fd6] text-white', positionClass: 'left-6 bottom-10' },
      { label: 'Bronte', className: 'bg-[#23d8dd] text-slate-900', positionClass: 'right-5 top-12' },
      { label: 'Chandra', className: 'bg-[#1ef28d] text-slate-900', positionClass: 'right-8 bottom-8' },
    ],
  },
  {
    id: 'private-ready',
    accentTitle: 'Private',
    title: 'until you are ready.',
    accentClass: 'text-[#ff5b41]',
    leftPanelClass: 'bg-[#f7ecf4]',
    rightPanelClass: 'bg-[#ff5b41]',
    cardTitle: 'WIP Project',
    cardItems: [
      'Plan team activities',
      'Decide on Airbnb',
      'Book flights and rental cars',
      'Share budget notes',
    ],
    tags: [{ label: 'shhhh!', className: 'bg-white text-slate-900', positionClass: 'left-10 top-8' }],
  },
];

type SurfaceStat = {
  label: string;
  value: string;
  detail: string;
  toneClass: string;
};

type ActivityItem = {
  title: string;
  meta: string;
  accentClass: string;
};

type TimelineItem = {
  title: string;
  note: string;
  statusClass: string;
};

const surfaceStats: SurfaceStat[] = [
  { label: 'Lists', value: '128', detail: '+18% this month', toneClass: 'bg-indigo-100 text-indigo-700' },
  { label: 'Automations', value: '42', detail: '+9 active now', toneClass: 'bg-emerald-100 text-emerald-700' },
  { label: 'Members', value: '26', detail: 'Across 4 teams', toneClass: 'bg-sky-100 text-sky-700' },
  { label: 'Private spaces', value: '11', detail: 'Security locked', toneClass: 'bg-rose-100 text-rose-700' },
];

const activityFeed: ActivityItem[] = [
  { title: 'Brand sync checklist', meta: 'Edited 3m ago', accentClass: 'bg-indigo-500' },
  { title: 'Release notes draft', meta: 'Assigned to design', accentClass: 'bg-emerald-500' },
  { title: 'Sprint planning board', meta: '5 comments', accentClass: 'bg-orange-500' },
  { title: 'Hiring pipeline tasks', meta: 'Moved to review', accentClass: 'bg-sky-500' },
];

const commandRail = [
  'Overview',
  'Workspaces',
  'Templates',
  'Integrations',
  'Automation',
  'Security',
];

const timelineEvents: TimelineItem[] = [
  { title: 'Kickoff', note: 'Scope and owners aligned', statusClass: 'bg-emerald-500' },
  { title: 'Design review', note: 'Flow approved by product', statusClass: 'bg-indigo-500' },
  { title: 'Build sprint', note: 'Integrations in progress', statusClass: 'bg-amber-500' },
  { title: 'Launch prep', note: 'QA and docs checklist', statusClass: 'bg-rose-500' },
];

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localNotice, setLocalNotice] = useState('');

  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
    loading,
    error,
    clearError,
  } = useAuthStore();

  const clearFeedback = (clearNotice = true) => {
    setLocalError('');
    if (clearNotice) {
      setLocalNotice('');
    }
    clearError();
  };

  const setAuthMode = (nextMode: AuthMode, clearNotice = true) => {
    setMode(nextMode);
    clearFeedback(clearNotice);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }

      const result = await signUp(normalizedEmail, password);
      if (result.success && result.requiresEmailConfirmation) {
        setLocalNotice(
          `Account created. Verify ${normalizedEmail} from your inbox, then sign in.`
        );
        setAuthMode('signin', false);
      }
    } else {
      await signIn(normalizedEmail, password);
    }
  };

  const handleProvider = async (provider: 'google' | 'github') => {
    clearFeedback();
    if (provider === 'google') {
      await signInWithGoogle();
    } else {
      await signInWithGithub();
    }
  };

  const displayError = localError || error;
  const isSignIn = mode === 'signin';

  const basePath = import.meta.env.BASE_URL || '/';
  const localAuthHref = `${basePath.replace(/\/$/, '')}/auth`;
  const externalSignInUrl =
    import.meta.env.VITE_AUTH_SIGNIN_URL?.trim() || 'https://insforge.dev/auth/sign-in';
  const authHref = externalSignInUrl;
  const normalizePath = (path: string) => {
    const normalized = path.replace(/\/+$/, '');
    return normalized || '/';
  };
  const isAuthPage =
    typeof window !== 'undefined' &&
    normalizePath(window.location.pathname) === normalizePath(localAuthHref);

  const AuthForm = (
    <section
      id="auth-panel"
      className="mx-auto mt-8 w-full max-w-2xl rounded-[1.2rem] border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.08)] sm:p-8"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Authentication</p>
          <h2 className="mt-1 text-3xl font-semibold text-slate-900">
            {isSignIn ? `Log in to ${appName}` : `Create your ${appName} account`}
          </h2>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          Stay signed in
          <Checkbox
            id="stay-signed"
            checked={rememberMe}
            onCheckedChange={(value) => setRememberMe(Boolean(value))}
            className="border-slate-300 data-[state=checked]:bg-[#1f4f3c] data-[state=checked]:text-white"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-md border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50 sm:col-span-2"
          onClick={() => {
            window.location.assign(externalSignInUrl);
          }}
        >
          Continue on Insforge
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-md border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50"
          disabled={loading}
          onClick={() => handleProvider('google')}
        >
          <Chrome className="mr-2 h-4 w-4 text-[#DB4437]" />
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-md border-slate-200 bg-white text-slate-800 transition hover:bg-slate-50"
          disabled={loading}
          onClick={() => handleProvider('github')}
        >
          <Github className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>
      </div>

      <div className="my-5 flex items-center gap-3 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
            <Input
              id="email"
              type="email"
              placeholder="yourname@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-md border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Password</p>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white pr-3">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-0 bg-transparent text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1 flex justify-end">
              <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-700" disabled={loading}>
                Forgot Password
              </button>
            </div>
          </div>
        </div>

        {displayError && (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {displayError}
          </div>
        )}
        {localNotice && (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {localNotice}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            type="submit"
            className="h-11 min-w-[110px] rounded-md bg-[#1f4f3c] px-5 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(31,79,60,0.35)] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (isSignIn ? 'Logging in...' : 'Creating account...') : isSignIn ? 'Log in' : 'Create account'}
          </Button>
          <Button
            type="submit"
            className="grid h-11 w-12 place-items-center rounded-md bg-[#1f4f3c] text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(31,79,60,0.35)] disabled:opacity-60"
            disabled={loading}
            aria-label={isSignIn ? 'Submit login' : 'Submit signup'}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        By signing up, you agree to the <button className="underline">Terms of Use</button> and{' '}
        <button className="underline">Privacy Policy</button>.
      </p>
      {isSignIn ? (
        <p className="mt-4 text-center text-sm text-slate-600">
          New user?{' '}
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className="font-semibold text-slate-800 underline"
            disabled={loading}
          >
            Sign up
          </button>
        </p>
      ) : (
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className="font-semibold text-slate-800 underline"
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      )}
    </section>
  );

  if (isAuthPage) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f0eef6] px-4 py-10 text-slate-900 sm:px-6">
        <NeuralBackground
          className="pointer-events-none absolute inset-0 opacity-25 mix-blend-screen"
          color="#c7d2fe"
          trailOpacity={0.08}
          particleCount={500}
          speed={0.6}
        />
        <div className="relative mx-auto max-w-6xl">{AuthForm}</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-y-auto bg-[#f0eef6] px-4 py-6 text-slate-900 sm:px-6">
      <NeuralBackground
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-screen"
        color="#c7d2fe"
        trailOpacity={0.08}
        particleCount={500}
        speed={0.6}
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-slate-300/60 bg-[#efedf5] shadow-[0_18px_55px_rgba(30,41,59,0.08)]">
          <div className="h-1 w-full bg-[#ff5b41]" />

          <header className="px-5 pb-6 pt-5 sm:px-8 sm:pt-6">
            <div className="flex items-start justify-end gap-4">
              {/* Brand tag removed per request */}

              <a
                href={authHref}
                className={primaryActionClass}
                aria-label="Go to sign in page"
              >
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </header>

          <section className="px-5 pb-6 sm:px-8">
            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
              <article className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.08)] sm:p-8">
                <div className="pointer-events-none absolute -left-12 -top-10 h-48 w-48 rounded-full bg-[#665de7]/20 blur-2xl" />
                <div className="pointer-events-none absolute -right-12 -bottom-12 h-52 w-52 rounded-full bg-[#ff5b41]/20 blur-2xl" />
                <div className="relative">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">About the app</p>
                  <h1 className="mt-3 text-4xl font-semibold leading-[0.95] tracking-tight text-slate-900 sm:text-6xl">
                    One command center for
                    <span className="block text-[#ff5b41]">tasks, teams, and focus.</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                    Move between personal planning and team execution without changing tools. Everything from notes
                    to timelines lives in one layered workspace.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <span className={tagClass}>Lists</span>
                    <span className={tagClass}>Workflows</span>
                    <span className={tagClass}>Real-time</span>
                    <span className="rounded-full border border-[#ff5b41]/30 bg-[#ff5b41]/10 px-4 py-2 text-sm font-semibold text-[#ff5b41]">
                      Multi-layer layout
                    </span>
                  </div>

                  <div className="mt-7 grid gap-3 sm:grid-cols-[0.34fr_0.66fr]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="h-4 w-4" />
                        <p className="text-sm font-semibold">Workspace views</p>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm font-medium text-slate-700">
                        <li className="rounded-lg bg-white px-2 py-1">Daily standup board</li>
                        <li className="rounded-lg bg-white px-2 py-1">Campaign calendar</li>
                        <li className="rounded-lg bg-white px-2 py-1">Hiring pipeline</li>
                        <li className="rounded-lg bg-white px-2 py-1">Private notes</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-[#f5f6fb] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Live board</p>
                      <h3 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Daily Habits</h3>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700 sm:text-base">
                        <li className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                          Journal
                        </li>
                        <li className="flex items-center gap-2 line-through decoration-[#ff5b41] decoration-2">
                          <span className="h-3.5 w-3.5 rounded-full border border-slate-300 bg-[#ff5b41]" />
                          Train gymnastics
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                          Write for 30 minutes
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                          Draw before bed
                        </li>
                      </ul>
                      <div className="mt-4 h-2 rounded-full bg-slate-200">
                        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#665de7] to-[#ff5b41]" />
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <article className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Workspace pulse</p>
                    <Sparkles className="h-4 w-4 text-[#ff5b41]" />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {surfaceStats.map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${stat.toneClass}`}>
                          {stat.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.07)]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Live activity</p>
                    <Clock3 className="h-4 w-4 text-indigo-500" />
                  </div>
                  <ul className="mt-4 space-y-3">
                    {activityFeed.map((item) => (
                      <li key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.accentClass}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.meta}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>
          </section>

          <section className="px-5 pb-8 sm:px-8 sm:pb-10">
            <div className="grid gap-4 xl:grid-cols-[210px_minmax(0,1fr)]">
              <aside className="rounded-3xl border border-slate-200 bg-white/90 p-4 xl:sticky xl:top-6 xl:h-fit">
                <div className="flex items-center gap-2 text-slate-700">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">Command rail</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm font-semibold">
                  {commandRail.map((item, index) => (
                    <li
                      key={item}
                      className={`rounded-xl px-3 py-2 ${
                        index === 0 ? 'bg-[#111027] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secure mode enabled
                  </div>
                  <p className="mt-1">Private lists stay encrypted until you share access.</p>
                </div>
              </aside>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">About the app</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Scroll through interactive storyboards
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Swipe across the cards for different layout states: notes, integrations, privacy, and team
                    collaboration.
                  </p>
                </div>

                <div className="overflow-x-auto pb-4">
                  <div className="flex w-max snap-x snap-mandatory gap-4 pr-2">
                    {featureSlides.map((slide) => (
                      <article
                        key={slide.id}
                        className="w-[92vw] max-w-[960px] snap-start overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] lg:w-[960px]"
                      >
                        <div className="grid md:grid-cols-2">
                          <div className={`flex min-h-[300px] items-center p-8 sm:p-10 ${slide.leftPanelClass}`}>
                            <div className="space-y-2">
                              <h2 className={`text-4xl font-semibold leading-tight tracking-tight sm:text-5xl ${slide.accentClass}`}>
                                {slide.accentTitle}
                              </h2>
                              <p className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                                {slide.title}
                              </p>
                            </div>
                          </div>

                          <div className={`relative flex min-h-[300px] items-center justify-center overflow-hidden p-6 sm:p-8 ${slide.rightPanelClass}`}>
                            <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.65)_0,transparent_38%),radial-gradient(circle_at_84%_75%,rgba(255,255,255,0.55)_0,transparent_42%)]" />
                            <div className="relative w-full max-w-[320px] rounded-[1.6rem] bg-white p-5 shadow-[0_20px_45px_rgba(15,23,42,0.2)]">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Preview
                              </p>
                              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                                {slide.cardTitle}
                              </h3>
                              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                                {slide.cardItems.map((item) => (
                                  <li key={item} className="flex items-center gap-2">
                                    <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {slide.tags.map((tag) => (
                              <span
                                key={tag.label}
                                className={`absolute rounded-full px-3 py-1 text-xs font-semibold shadow-lg ${tag.className} ${tag.positionClass}`}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <article className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock3 className="h-4 w-4 text-[#ff5b41]" />
                      <p className="text-sm font-semibold">Launch timeline</p>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {timelineEvents.map((event) => (
                        <li key={event.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${event.statusClass}`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                            <p className="text-xs text-slate-500">{event.note}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#625bf0] to-[#2f94e8] p-5 text-white shadow-[0_20px_40px_rgba(99,102,241,0.35)] sm:p-6">
                    <div className="absolute -right-16 -top-14 h-44 w-44 rounded-full bg-white/20 blur-xl" />
                    <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-[#ff5b41]/40 blur-xl" />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-white/90">
                        <Workflow className="h-4 w-4" />
                        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Integration cloud</p>
                      </div>
                      <h3 className="mt-2 text-3xl font-semibold leading-tight tracking-tight">
                        Pull every tool into one canvas
                      </h3>
                      <p className="mt-2 text-sm text-white/80">
                        Connect Slack, GitHub, Notion, Calendar, and Figma then automate handoffs instantly.
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-white/20 px-3 py-1.5 text-center">Slack</span>
                        <span className="rounded-full bg-white/20 px-3 py-1.5 text-center">GitHub</span>
                        <span className="rounded-full bg-white/20 px-3 py-1.5 text-center">Notion</span>
                        <span className="rounded-full bg-white/20 px-3 py-1.5 text-center">Figma</span>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white/90 p-4 text-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Auto-sync rules</p>
                        <div className="mt-3 space-y-2">
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span>Task updates</span>
                              <span>84%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div className="h-full w-[84%] rounded-full bg-[#625bf0]" />
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span>Release alerts</span>
                              <span>67%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div className="h-full w-[67%] rounded-full bg-[#2f94e8]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Auth panel removed for external navigation */}
      </div>
    </div>
  );
}

export default AuthPage;
