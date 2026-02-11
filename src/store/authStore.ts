import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthResult = { success: boolean; error?: string; requiresEmailConfirmation?: boolean };

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const missingAuthConfigMessage =
  'Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';

let authStateSubscription:
  | {
      unsubscribe: () => void;
    }
  | null = null;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    authStateSubscription?.unsubscribe();
    authStateSubscription = null;
  });
}

const mapAuthErrorMessage = (message: string) => {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }

  return message;
};

interface AuthState {
  user: User | null;
  session: Session | null;
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
    if (!supabase || !isSupabaseConfigured) {
      set({ initialized: true });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ 
        session, 
        user: session?.user ?? null,
        initialized: true 
      });

      // Listen for auth changes
      if (!authStateSubscription) {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          set({ 
            session, 
            user: session?.user ?? null 
          });
        });
        authStateSubscription = data.subscription;
      }
    } catch {
      set({ initialized: true });
    }
  },

  signUp: async (email, password) => {
    if (!supabase || !isSupabaseConfigured) {
      set({ loading: false, error: missingAuthConfigMessage });
      return { success: false, error: missingAuthConfigMessage };
    }

    set({ loading: true, error: null });
    try {
      const normalizedEmail = normalizeEmail(email);
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const message = mapAuthErrorMessage(error.message);
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      if (!data.session) {
        set({
          user: null,
          session: null,
          loading: false,
        });

        return { success: true, requiresEmailConfirmation: true };
      }

      set({ 
        user: data.session.user, 
        session: data.session, 
        loading: false 
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
    if (!supabase || !isSupabaseConfigured) {
      set({ loading: false, error: missingAuthConfigMessage });
      return { success: false, error: missingAuthConfigMessage };
    }

    set({ loading: true, error: null });
    try {
      const normalizedEmail = normalizeEmail(email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const message = mapAuthErrorMessage(error.message);
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      set({ 
        user: data.session?.user ?? data.user,
        session: data.session, 
        loading: false 
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
    if (!supabase || !isSupabaseConfigured) {
      set({ loading: false, error: missingAuthConfigMessage });
      return { success: false, error: missingAuthConfigMessage };
    }

    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });

      if (error) {
        const message = mapAuthErrorMessage(error.message);
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      // OAuth redirects, so we don't set loading to false here
      return { success: true };
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'An error occurred';
      const message = mapAuthErrorMessage(baseMessage);
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  signInWithGithub: async () => {
    if (!supabase || !isSupabaseConfigured) {
      set({ loading: false, error: missingAuthConfigMessage });
      return { success: false, error: missingAuthConfigMessage };
    }

    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
        },
      });

      if (error) {
        const message = mapAuthErrorMessage(error.message);
        set({ loading: false, error: message });
        return { success: false, error: message };
      }

      return { success: true };
    } catch (err) {
      const baseMessage = err instanceof Error ? err.message : 'An error occurred';
      const message = mapAuthErrorMessage(baseMessage);
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  signOut: async () => {
    if (!supabase || !isSupabaseConfigured) {
      set({ loading: false, error: missingAuthConfigMessage, user: null, session: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        set({ loading: false, error: mapAuthErrorMessage(error.message) });
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
