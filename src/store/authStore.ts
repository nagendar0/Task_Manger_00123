import { create } from 'zustand';

type AuthResult = { success: boolean; error?: string; requiresEmailConfirmation?: boolean };

type LocalAccount = {
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

type LegacyLocalAccount = {
  email: string;
  password: string;
  createdAt?: string;
};

type StoredAccount = LocalAccount | LegacyLocalAccount;

type AuthUser = {
  id: string;
  email: string;
};

type AuthSession = {
  user: AuthUser;
  issuedAt: number;
  expiresAt: number;
};

type StoredSession = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

const AUTH_USER_STORAGE_KEY = 'task-manager-auth-user';
const AUTH_ACCOUNTS_STORAGE_KEY = 'task-manager-auth-accounts';
const AUTH_SESSION_STORAGE_KEY = 'task-manager-auth-session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const OAUTH_NOT_CONFIGURED_MESSAGE = 'OAuth sign-in is not configured yet.';

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

const createSalt = (): string => {
  if (!hasWindow() || !window.crypto?.getRandomValues) {
    return `${Date.now()}`;
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
};

const hashPassword = async (password: string, salt: string): Promise<string> => {
  if (!hasWindow() || !window.crypto?.subtle) {
    return `${salt}:${password}`;
  }

  const encoded = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await window.crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
};

const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
};

const parseStoredAccount = (value: unknown): StoredAccount | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.email !== 'string') {
    return null;
  }

  const email = normalizeEmail(record.email);
  if (!email) {
    return null;
  }

  if (typeof record.passwordHash === 'string' && typeof record.salt === 'string') {
    return {
      email,
      passwordHash: record.passwordHash,
      salt: record.salt,
      createdAt:
        typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    };
  }

  if (typeof record.password === 'string') {
    return {
      email,
      password: record.password,
      createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
    };
  }

  return null;
};

const readAccounts = (): StoredAccount[] => {
  const raw = readJson<unknown>(AUTH_ACCOUNTS_STORAGE_KEY, []);
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => parseStoredAccount(entry))
    .filter((entry): entry is StoredAccount => entry !== null);
};

const writeAccounts = (accounts: LocalAccount[]) => writeJson(AUTH_ACCOUNTS_STORAGE_KEY, accounts);
const readStoredSession = () => readJson<StoredSession | null>(AUTH_SESSION_STORAGE_KEY, null);

const writeUser = (user: AuthUser | null) => {
  if (user) {
    writeJson(AUTH_USER_STORAGE_KEY, user);
    return;
  }
  removeStoredValue(AUTH_USER_STORAGE_KEY);
};

const writeStoredSession = (session: StoredSession | null) => {
  if (session) {
    writeJson(AUTH_SESSION_STORAGE_KEY, session);
    return;
  }
  removeStoredValue(AUTH_SESSION_STORAGE_KEY);
};

const mapAuthErrorMessage = (message: string) => {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  return message;
};

const isLocalAccount = (account: StoredAccount): account is LocalAccount =>
  'passwordHash' in account && 'salt' in account;

const ensureHashedAccounts = async (): Promise<LocalAccount[]> => {
  const accounts = readAccounts();
  let changed = false;
  const hashedAccounts: LocalAccount[] = [];

  for (const account of accounts) {
    if (isLocalAccount(account)) {
      hashedAccounts.push(account);
      continue;
    }

    const salt = createSalt();
    const passwordHash = await hashPassword(account.password, salt);
    hashedAccounts.push({
      email: account.email,
      passwordHash,
      salt,
      createdAt: account.createdAt ?? new Date().toISOString(),
    });
    changed = true;
  }

  if (changed) {
    writeAccounts(hashedAccounts);
  }

  return hashedAccounts;
};

const makeUser = (email: string): AuthUser => ({
  id: normalizeEmail(email),
  email: normalizeEmail(email),
});

const createSessionForEmail = (email: string): StoredSession => {
  const issuedAt = Date.now();
  return {
    email: normalizeEmail(email),
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_MS,
  };
};

const resolveAuthFromStorage = async () => {
  const session = readStoredSession();
  if (!session || session.expiresAt <= Date.now()) {
    writeStoredSession(null);
    writeUser(null);
    return { user: null, session: null };
  }

  const accounts = await ensureHashedAccounts();
  const exists = accounts.some((account) => account.email === session.email);
  if (!exists) {
    writeStoredSession(null);
    writeUser(null);
    return { user: null, session: null };
  }

  const user = makeUser(session.email);
  writeUser(user);
  return {
    user,
    session: {
      user,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    },
  };
};

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
    const { user, session } = await resolveAuthFromStorage();
    set({
      user,
      session,
      initialized: true,
    });
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const normalizedEmail = normalizeEmail(email);
      const accounts = await ensureHashedAccounts();
      const existingAccount = accounts.find((account) => account.email === normalizedEmail);
      if (existingAccount) {
        const message = 'An account with this email already exists.';
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      const salt = createSalt();
      const passwordHash = await hashPassword(password, salt);
      const nextAccounts = [
        ...accounts,
        {
          email: normalizedEmail,
          passwordHash,
          salt,
          createdAt: new Date().toISOString(),
        },
      ];
      writeAccounts(nextAccounts);

      const user = makeUser(normalizedEmail);
      const storedSession = createSessionForEmail(normalizedEmail);
      writeUser(user);
      writeStoredSession(storedSession);
      set({
        user,
        session: {
          user,
          issuedAt: storedSession.issuedAt,
          expiresAt: storedSession.expiresAt,
        },
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
      const accounts = await ensureHashedAccounts();
      const account = accounts.find((item) => item.email === normalizedEmail);
      if (!account) {
        const message = mapAuthErrorMessage('Invalid login credentials');
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      const attemptedHash = await hashPassword(password, account.salt);
      if (!safeEqual(account.passwordHash, attemptedHash)) {
        const message = mapAuthErrorMessage('Invalid login credentials');
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      const user = makeUser(normalizedEmail);
      const storedSession = createSessionForEmail(normalizedEmail);
      writeUser(user);
      writeStoredSession(storedSession);
      set({
        user,
        session: {
          user,
          issuedAt: storedSession.issuedAt,
          expiresAt: storedSession.expiresAt,
        },
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
    set({ loading: false, error: OAUTH_NOT_CONFIGURED_MESSAGE });
    return { success: false, error: OAUTH_NOT_CONFIGURED_MESSAGE };
  },

  signInWithGithub: async () => {
    set({ loading: false, error: OAUTH_NOT_CONFIGURED_MESSAGE });
    return { success: false, error: OAUTH_NOT_CONFIGURED_MESSAGE };
  },

  signOut: async () => {
    set({ loading: true, error: null });
    writeUser(null);
    writeStoredSession(null);
    set({ user: null, session: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));
