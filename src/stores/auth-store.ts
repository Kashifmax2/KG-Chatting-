import { create } from "zustand";
import type { User } from "@/types";
import { authService } from "@/services/auth/auth.service";
import { logger } from "@/utils/logger";

interface RegisterInput {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  remember?: boolean;
}

interface AuthState {
  /** True once the initial Firebase auth-state check has resolved. */
  authReady: boolean;
  isAuthenticated: boolean;
  user: User | null;
  /** True while verification email is pending for the signed-in user. */
  emailVerified: boolean;
  /** Last auth error message, safe to show in the UI. */
  error: string | null;

  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  /** Re-check verification from the server; returns the latest verified state. */
  refreshVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;

  /** Start the Firebase auth listener. Call once at app boot. */
  init: () => () => void;
}

/**
 * Firebase-backed auth store. There is NO mock fallback — the app authenticates
 * against Firebase Authentication only (Phase 04). Session state is driven by
 * `onAuthStateChanged`, not by the individual action calls, so refresh, token
 * refresh, and multi-tab sign-out all stay in sync automatically.
 *
 * "Remember me" maps to Firebase persistence (local vs session) inside the
 * service, so we deliberately do NOT persist the user object here.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  authReady: false,
  isAuthenticated: false,
  user: null,
  emailVerified: false,
  error: null,

  login: async (email, password, remember) => {
    set({ error: null });
    const res = await authService.signInWithEmail({ email, password, remember });
    if (!res.ok) {
      set({ error: res.error.message });
      throw new Error(res.error.message);
    }
    // The auth listener will set the authenticated state; setting it here too
    // avoids a flash of the login screen before the listener fires.
    set({ isAuthenticated: true, user: res.data });
  },

  register: async (data) => {
    set({ error: null });
    const res = await authService.registerWithEmail(data);
    if (!res.ok) {
      set({ error: res.error.message });
      throw new Error(res.error.message);
    }
    set({ isAuthenticated: true, user: res.data });
  },

  loginWithGoogle: async () => {
    set({ error: null });
    const res = await authService.signInWithGoogle();
    if (!res.ok) {
      set({ error: res.error.message });
      throw new Error(res.error.message);
    }
    set({ isAuthenticated: true, user: res.data });
  },

  loginWithGitHub: async () => {
    set({ error: null });
    const res = await authService.signInWithGitHub();
    if (!res.ok) {
      set({ error: res.error.message });
      throw new Error(res.error.message);
    }
    set({ isAuthenticated: true, user: res.data });
  },

  resetPassword: async (email) => {
    set({ error: null });
    const res = await authService.sendPasswordReset(email);
    if (!res.ok) {
      set({ error: res.error.message });
      throw new Error(res.error.message);
    }
  },

  resendVerification: async () => {
    set({ error: null });
    const res = await authService.sendEmailVerification();
    if (!res.ok) {
      set({ error: res.error.message });
      throw new Error(res.error.message);
    }
  },

  refreshVerification: async () => {
    const res = await authService.reloadUser();
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    set({ emailVerified: res.data });
    return res.data;
  },

  logout: async () => {
    const res = await authService.signOut();
    if (!res.ok) {
      // Surface but don't throw — the UI treats logout as fire-and-forget.
      set({ error: res.error.message });
      logger.error("signOut failed", res.error);
      return;
    }
    set({ isAuthenticated: false, user: null, emailVerified: false });
  },

  clearError: () => set({ error: null }),

  init: () => {
    // Subscribe to Firebase auth-state changes. Returns the unsubscribe fn so
    // the caller can clean up (e.g. in StrictMode double-invoke).
    return authService.onAuthStateChanged(async (fbUser) => {
      if (!fbUser) {
        set({ authReady: true, isAuthenticated: false, user: null, emailVerified: false });
        return;
      }

      // Hydrate the profile document for the signed-in user. restoreSession
      // wraps the Firestore read in retry-with-backoff, so a transient network
      // blip on refresh self-heals instead of dropping the session.
      const res = await authService.restoreSession();
      if (res.ok && res.data) {
        set({
          authReady: true,
          isAuthenticated: true,
          user: res.data,
          emailVerified: fbUser.emailVerified,
        });
      } else {
        // Authenticated but no profile (mid-provisioning or a data issue).
        // Keep them unauthenticated in the app's eyes rather than half-logged-in.
        if (!res.ok) logger.error("profile hydrate failed", res.error);
        set({
          authReady: true,
          isAuthenticated: false,
          user: get().user,
          emailVerified: fbUser.emailVerified,
        });
      }
    });
  },
}));
