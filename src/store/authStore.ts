import { create } from 'zustand';

type AuthResult = { success: boolean; error?: string; requiresEmailConfirmation?: boolean };

type LocalAccount = {
  email: string;
  password: string;
};

type AuthUser = {
  id: string;
  email: string;
};

type AuthSession = {
  user: AuthUser;
};

const AUTH_USER_STORAGE_KEY = 'task-manager-auth-user';
const AUTH_ACCOUNTS_STORAGE_KEY = 'task-manager-auth-accounts';

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const hasWindow = () => typeof window !== 'undefined';

const readJson = <T>(key: string, fallback: T): T => {
  if (!hasWindow()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeStoredValue = (key: string) => {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.removeItem(key);
};

const readAccounts = () => readJson<LocalAccount[]>(AUTH_ACCOUNTS_STORAGE_KEY, []);
const writeAccounts = (accounts: LocalAccount[]) => writeJson(AUTH_ACCOUNTS_STORAGE_KEY, accounts);
const readUser = () => readJson<AuthUser | null>(AUTH_USER_STORAGE_KEY, null);

const writeUser = (user: AuthUser | null) => {
  if (user) {
    writeJson(AUTH_USER_STORAGE_KEY, user);
    return;
  }
  removeStoredValue(AUTH_USER_STORAGE_KEY);
};

const mapAuthErrorMessage = (message: string) => {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  return message;
};

const makeUser = (email: string): AuthUser => ({
  id: `${normalizeEmail(email)}-${Date.now()}`,
  email: normalizeEmail(email),
});

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithGithub: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    const user = readUser();
    set({
      user,
      session: user ? { user } : null,
      initialized: true,
    });
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const normalizedEmail = normalizeEmail(email);
      const accounts = readAccounts();
      const existingAccount = accounts.find((account) => account.email === normalizedEmail);
      if (existingAccount) {
        const message = 'An account with this email already exists.';
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      const nextAccounts = [...accounts, { email: normalizedEmail, password }];
      writeAccounts(nextAccounts);

      const user = makeUser(normalizedEmail);
      writeUser(user);
      set({
        user,
        session: { user },
        loading: false,
      });
      return { success: true };
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'An error occurred';
      const message = mapAuthErrorMessage(baseMessage);
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const normalizedEmail = normalizeEmail(email);
      const accounts = readAccounts();
      const account = accounts.find((item) => item.email === normalizedEmail);
      if (!account || account.password !== password) {
        const message = mapAuthErrorMessage('Invalid login credentials');
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      const user = makeUser(normalizedEmail);
      writeUser(user);
      set({
        user,
        session: { user },
        loading: false,
      });
      return { success: true };
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'An error occurred';
      const message = mapAuthErrorMessage(baseMessage);
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    const user = makeUser('google.user@local.app');
    writeUser(user);
    set({
      user,
      session: { user },
      loading: false,
    });
    return { success: true };
  },

  signInWithGithub: async () => {
    set({ loading: true, error: null });
    const user = makeUser('github.user@local.app');
    writeUser(user);
    set({
      user,
      session: { user },
      loading: false,
    });
    return { success: true };
  },

  signOut: async () => {
    set({ loading: true, error: null });
    writeUser(null);
    set({ user: null, session: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));
