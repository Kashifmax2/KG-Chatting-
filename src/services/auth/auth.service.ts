/**
 * AuthService — authentication foundation.
 *
 * Wraps Firebase Authentication behind a typed contract. No UI lives here —
 * services never render. All methods return a `Result` so the store never sees
 * a raw throw; Firebase errors are mapped to friendly messages upstream.
 *
 * Providers: email/password, Google, GitHub live now; Apple + anonymous are
 * structured for later. Registration provisions the Firestore documents a new
 * account needs (see `provisionNewUser`) and rolls back — including deleting the
 * Auth account — if provisioning fails.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously as fbSignInAnonymously,
  sendPasswordResetEmail,
  sendEmailVerification as fbSendEmailVerification,
  reload,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged as fbOnAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut as fbSignOut,
  deleteUser,
  GoogleAuthProvider,
  GithubAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/config/firebase";
import type { Result, Unsubscribe } from "@/types/service";
import type { User } from "@/types";
import { run, toFailure, toSuccess } from "@/services/service-utils";
import { AppError, toAppError } from "@/utils/errors";
import { withRetry } from "@/utils/retry";
import { logger } from "@/utils/logger";
import { userService } from "@/services/users/user.service";
import { userDocToUser } from "@/services/auth/auth-mapper";
import { provisionNewUser } from "@/services/auth/user-provisioning";
import { checkUsernameAvailable } from "@/services/users/username";
import {
  getLockStatus,
  recordFailure,
  clearFailures,
  lockMessage,
} from "@/services/auth/rate-limiter";

export interface Credentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  /** "Remember me" — persist across browser restarts (default true). */
  remember?: boolean;
}

/**
 * Resolve an existing profile to the UI `User`, or fail if it's missing.
 *
 * The Firestore read is wrapped in `withRetry` so a transient network/offline
 * blip during login or session restore self-heals instead of bouncing the user
 * back to the login screen. A genuinely missing profile (permission/not-found)
 * is not retryable and fails fast.
 */
async function resolveProfile(uid: string): Promise<Result<User>> {
  try {
    const docData = await withRetry(async () => {
      const res = await userService.getUser(uid);
      // Re-throw so withRetry can decide whether the failure is retryable.
      if (!res.ok) throw res.error.cause ?? new Error(res.error.message);
      return res.data;
    });
    if (!docData) {
      return toFailure(
        new AppError("not-found", "We couldn't find your profile. Please contact support.")
      );
    }
    return toSuccess(userDocToUser(docData));
  } catch (error) {
    return toFailure(error);
  }
}

/** Apply the "remember me" persistence choice before a sign-in call. */
async function applyPersistence(remember: boolean | undefined): Promise<void> {
  await setPersistence(
    auth,
    remember === false ? browserSessionPersistence : browserLocalPersistence
  );
}

export const authService = {
  /**
   * Create an account with email + password, then provision its Firestore
   * documents. Rolls back the Auth account if provisioning fails.
   */
  async registerWithEmail(data: RegistrationData): Promise<Result<User>> {
    await applyPersistence(data.remember);

    // Reserve/uniqueness/profanity screen before creating anything.
    const nameCheck = await checkUsernameAvailable(data.username);
    if (!nameCheck.ok) {
      return toFailure(new AppError("already-exists", nameCheck.message));
    }

    let created: FirebaseUser | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      created = cred.user;

      const displayName = data.displayName?.trim() || data.username;
      await fbUpdateProfile(created, { displayName });

      const provisioned = await provisionNewUser({
        uid: created.uid,
        email: data.email,
        emailVerified: created.emailVerified,
        username: data.username,
        displayName,
      });

      if (!provisioned.ok) {
        // Provisioning failed and already rolled back its docs; remove the
        // orphaned Auth account so the email can be reused cleanly.
        await deleteUser(created).catch((err) =>
          logger.error("failed to delete orphaned auth user", err)
        );
        return provisioned;
      }

      // Fire-and-forget verification email; failure shouldn't block signup.
      fbSendEmailVerification(created).catch((err) =>
        logger.warn("sendEmailVerification failed", err)
      );

      return toSuccess(userDocToUser(provisioned.data));
    } catch (error) {
      if (created) {
        await deleteUser(created).catch((err) =>
          logger.error("failed to delete auth user after error", err)
        );
      }
      return toFailure(error);
    }
  },

  /**
   * Sign in with email + password. Guarded by a client-side attempt throttle
   * (best-effort brute-force protection) on top of Firebase's own limiter.
   */
  async signInWithEmail(creds: Credentials & { remember?: boolean }): Promise<Result<User>> {
    // Reject early if this email is locally locked out.
    const lock = getLockStatus(creds.email);
    if (lock.locked) {
      return toFailure(new AppError("rate-limited", lockMessage(lock.retryAfterSec)));
    }

    try {
      await applyPersistence(creds.remember);
      const cred = await signInWithEmailAndPassword(auth, creds.email, creds.password);
      const profile = await resolveProfile(cred.user.uid);
      if (!profile.ok) throw profile.error.cause ?? new Error(profile.error.message);
      // Success — reset the failure counter for this email.
      clearFailures(creds.email);
      return toSuccess(profile.data);
    } catch (error) {
      const appError = toAppError(error);
      // Only count genuine credential rejections toward the lockout, not
      // network/offline blips or a missing-profile data issue.
      if (appError.code === "invalid-input" || appError.code === "not-found") {
        const status = recordFailure(creds.email);
        if (status.locked) {
          return toFailure(new AppError("rate-limited", lockMessage(status.retryAfterSec)));
        }
      }
      return toFailure(appError);
    }
  },

  /** Sign in with Google; provisions a profile on first sign-in. */
  async signInWithGoogle(): Promise<Result<User>> {
    return this._oauth(new GoogleAuthProvider());
  },

  /** Sign in with GitHub; provisions a profile on first sign-in. */
  async signInWithGitHub(): Promise<Result<User>> {
    return this._oauth(new GithubAuthProvider());
  },

  /** Shared OAuth popup flow: sign in, then ensure a profile exists. */
  async _oauth(
    provider: GoogleAuthProvider | GithubAuthProvider
  ): Promise<Result<User>> {
    try {
      await applyPersistence(true);
      const cred = await signInWithPopup(auth, provider);
      const fbUser = cred.user;

      const existing = await userService.getUser(fbUser.uid);
      if (!existing.ok) return existing;
      if (existing.data) return toSuccess(userDocToUser(existing.data));

      // First OAuth sign-in: derive a username and provision.
      const base = (fbUser.email?.split("@")[0] ?? "user").replace(/[^a-zA-Z0-9._]/g, "");
      const provisioned = await provisionNewUser({
        uid: fbUser.uid,
        email: fbUser.email ?? "",
        emailVerified: fbUser.emailVerified,
        username: base || `user${fbUser.uid.slice(0, 6)}`,
        displayName: fbUser.displayName ?? base,
        avatarUrl: fbUser.photoURL ?? undefined,
      });
      if (!provisioned.ok) return provisioned;
      return toSuccess(userDocToUser(provisioned.data));
    } catch (error) {
      return toFailure(error);
    }
  },

  /**
   * Sign in with Apple (future-ready). The OAuth flow itself is identical to
   * Google/GitHub via `OAuthProvider("apple.com")`, but Apple sign-in requires
   * a paid Apple Developer account and Firebase console configuration that
   * aren't in place yet. Rather than surface a raw Firebase
   * `operation-not-allowed`, we fail with clear "coming soon" copy so the UI
   * can present it as a disabled/soon option.
   */
  async signInWithApple(): Promise<Result<User>> {
    return toFailure(
      new AppError(
        "unavailable",
        "Sign in with Apple is coming soon.",
        { message: "apple-provider-not-configured" }
      )
    );
  },

  /** Anonymous sign-in (future-ready — no profile provisioned yet). */
  async signInAnonymously(): Promise<Result<FirebaseUser>> {
    return run(async () => {
      const cred = await fbSignInAnonymously(auth);
      return cred.user;
    });
  },

  /** Send a password-reset email. */
  async sendPasswordReset(email: string): Promise<Result<void>> {
    return run(async () => {
      await sendPasswordResetEmail(auth, email);
    });
  },

  /** Send an email-verification link to the current user. */
  async sendEmailVerification(): Promise<Result<void>> {
    return run(async () => {
      if (!auth.currentUser) throw new AppError("unauthenticated", "Please sign in first.");
      await fbSendEmailVerification(auth.currentUser);
    });
  },

  /**
   * Reload the current Firebase user from the server and report whether their
   * email is now verified. Firebase caches `emailVerified` on the client, so
   * after the user clicks the link we must `reload()` before it flips true.
   */
  async reloadUser(): Promise<Result<boolean>> {
    return run(async () => {
      if (!auth.currentUser) throw new AppError("unauthenticated", "Please sign in first.");
      await reload(auth.currentUser);
      return auth.currentUser.emailVerified;
    });
  },

  /** Force-refresh the current user's ID token. */
  async refreshToken(): Promise<Result<string>> {
    return run(async () => {
      if (!auth.currentUser) throw new AppError("unauthenticated", "Please sign in first.");
      return auth.currentUser.getIdToken(true);
    });
  },

  /**
   * Restore the persisted session on app boot. Resolves with the mapped `User`
   * if a session exists and its profile loads, or null if signed out.
   */
  async restoreSession(): Promise<Result<User | null>> {
    return run(async () => {
      const fbUser = auth.currentUser;
      if (!fbUser) return null;
      const profile = await resolveProfile(fbUser.uid);
      if (!profile.ok) throw profile.error.cause ?? new Error(profile.error.message);
      return profile.data;
    });
  },

  /** Sign the current user out. */
  async signOut(): Promise<Result<void>> {
    return run(async () => {
      await fbSignOut(auth);
    });
  },

  /** Subscribe to auth-state changes; returns an unsubscribe fn. */
  onAuthStateChanged(cb: (user: FirebaseUser | null) => void): Unsubscribe {
    return fbOnAuthStateChanged(auth, cb, (err) =>
      logger.error("onAuthStateChanged error", err)
    );
  },
} as const;
