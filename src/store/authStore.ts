import { create } from 'zustand';
import { insforge, isInsforgeConfigured } from '@/lib/insforge';

type AuthResult = { success: boolean; error?: string; requiresEmailConfirmation?: boolean };

type AuthUser = {
  id: string;
  email: string;
  profile?: {
    name?: string;
    avatar_url?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type AuthSession = {
  accessToken: string;
  user: AuthUser;
  expiresAt?: Date;
};

const missingAuthConfigMessage =
  'Authentication is not configured. Please set VITE_INSFORGE_BASE_URL and VITE_INSFORGE_ANON_KEY.';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const mapAuthErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials') || normalized.includes('invalid_credentials')) {
    return 'Incorrect email or password.';
  }

  if (normalized.includes('email not verified') || normalized.includes('email verification')) {
    return 'Please verify your email address before signing in.';
  }

  return message;
};

const getAuthRedirectUrl = () => {
  const basePath = import.meta.env.BASE_URL || '/';
  return `${window.location.origin}${basePath.replace(/\/$/, '')}/auth`;
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
    if (!insforge || !isInsforgeConfigured) {
      set({ initialized: true, user: null, session: null });
      return;
    }

    try {
      const { data, error } = await insforge.auth.getCurrentSession();
      if (error) {
        set({ initialized: true, user: null, session: null });
        return;
      }

      const session = data?.session ?? null;
      set({
        initialized: true,
        session: session ? (session as AuthSession) : null,
        user: session?.user ? (session.user as AuthUser) : null,
      });
    } catch {
      set({ initialized: true, user: null, session: null });
    }
  },

  signUp: async (email, password) => {
    if (!insforge || !isInsforgeConfigured) {
      set({ loading: false, error: missingAuthConfigMessage });
      return { success: false, error: missingAuthConfigMessage };
    }

    set({ loading: true, error: null });
    try {
      const normalizedEmail = normalizeEmail(email);
      const { data, error } = await insforge.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const message = mapAuthErrorMessage(error.message ?? 'An error occurred');
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      if (data?.requireEmailVerification) {
        set({ user: null, session: null, loading: false });
        return { success: true, requiresEmailConfirmation: true };
      }

      if (data?.accessToken && data.user) {
        const session: AuthSession = {
          accessToken: data.accessToken,
          user: data.user as AuthUser,
        };
        set({ user: session.user, session, loading: false });
        return { success: true };
      }

      // Fallback: refresh session from storage/cookie if SDK saved it.
      const { data: sessionData } = await insforge.auth.getCurrentSession();
      const session = sessionData?.session ?? null;
      set({
        user: session?.user ? (session.user as AuthUser) : null,
        session: session ? (session as AuthSession) : null,
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
    if (!insforge || !isInsforgeConfigured) {
      set({ loading: false, error: missingAuthConfigMessage });
      return { success: false, error: missingAuthConfigMessage };
    }

    set({ loading: true, error: null });
    try {
      const normalizedEmail = normalizeEmail(email);
      const { data, error } = await insforge.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const message = mapAuthErrorMessage(error.message ?? 'An error occurred');
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      if (!data?.accessToken || !data.user) {
        const message = 'Sign-in failed. Please try again.';
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      const session: AuthSession = {
        accessToken: data.accessToken,
        user: data.user as AuthUser,
      };
      set({ user: session.user, session, loading: false });
      return { success: true };
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'An error occurred';
      const message = mapAuthErrorMessage(baseMessage);
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  signInWithGoogle: async () => {
    if (!insforge || !isInsforgeConfigured) {
      set({ loading: false, error: missingAuthConfigMessage });
      return { success: false, error: missingAuthConfigMessage };
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await insforge.auth.signInWithOAuth({
        provider: 'google',
        redirectTo: getAuthRedirectUrl(),
        skipBrowserRedirect: true,
      });

      if (error) {
        const message = mapAuthErrorMessage(error.message ?? 'An error occurred');
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      if (!data?.url) {
        const message = 'Unable to start Google sign-in. Please try again.';
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      window.location.assign(data.url);
      return { success: true };
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'An error occurred';
      const message = mapAuthErrorMessage(baseMessage);
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  signInWithGithub: async () => {
    if (!insforge || !isInsforgeConfigured) {
      set({ loading: false, error: missingAuthConfigMessage });
      return { success: false, error: missingAuthConfigMessage };
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await insforge.auth.signInWithOAuth({
        provider: 'github',
        redirectTo: getAuthRedirectUrl(),
        skipBrowserRedirect: true,
      });

      if (error) {
        const message = mapAuthErrorMessage(error.message ?? 'An error occurred');
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      if (!data?.url) {
        const message = 'Unable to start GitHub sign-in. Please try again.';
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      window.location.assign(data.url);
      return { success: true };
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'An error occurred';
      const message = mapAuthErrorMessage(baseMessage);
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  signOut: async () => {
    if (!insforge || !isInsforgeConfigured) {
      set({ user: null, session: null, loading: false, error: missingAuthConfigMessage });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { error } = await insforge.auth.signOut();
      if (error) {
        const message = mapAuthErrorMessage(error.message ?? 'An error occurred');
        set({ loading: false, error: message });
        return;
      }

      set({ user: null, session: null, loading: false });
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'An error occurred';
      const message = mapAuthErrorMessage(baseMessage);
      set({ loading: false, error: message });
    }
  },

  clearError: () => set({ error: null }),
}));
