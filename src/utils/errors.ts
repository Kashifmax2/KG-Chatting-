/**
 * Global error system for KG Chatting.
 *
 * Every service failure is normalised into an `AppError` so the UI layer can
 * rely on a single, predictable shape:
 *   - `code`    machine-readable category (for retry logic / branching)
 *   - `message` a safe, user-friendly sentence to show in the UI
 *   - `cause`   the original error, kept for developer logging only
 *
 * Nothing here throws Firebase's raw errors at the user — those are mapped to
 * friendly messages while the original is preserved for logs.
 */

export type AppErrorCode =
  | "network"
  | "offline"
  | "timeout"
  | "permission-denied"
  | "unauthenticated"
  | "not-found"
  | "already-exists"
  | "invalid-input"
  | "rate-limited"
  | "unavailable"
  | "cancelled"
  | "unknown";

/** Whether an operation that failed with this code is worth retrying. */
export function isRetryable(code: AppErrorCode): boolean {
  return (
    code === "network" ||
    code === "offline" ||
    code === "timeout" ||
    code === "unavailable" ||
    code === "rate-limited"
  );
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  /** Safe to render in the UI. */
  readonly userMessage: string;
  /** Original error, for developer logging only — never shown to users. */
  readonly cause?: unknown;

  constructor(
    code: AppErrorCode,
    userMessage: string,
    options?: { cause?: unknown; message?: string }
  ) {
    super(options?.message ?? userMessage);
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
    this.cause = options?.cause;
  }

  /** True if retrying the failed operation could succeed. */
  get retryable(): boolean {
    return isRetryable(this.code);
  }
}

/** Default user-facing copy for each error category. */
const USER_MESSAGES: Record<AppErrorCode, string> = {
  network: "We couldn't reach the server. Check your connection and try again.",
  offline: "You're offline. We'll retry once your connection is back.",
  timeout: "That took too long. Please try again.",
  "permission-denied": "You don't have permission to do that.",
  unauthenticated: "Please sign in to continue.",
  "not-found": "We couldn't find what you were looking for.",
  "already-exists": "That already exists.",
  "invalid-input": "Some of the information looks incorrect. Please check and try again.",
  "rate-limited": "You're doing that a bit too fast. Please wait a moment.",
  unavailable: "The service is temporarily unavailable. Please try again shortly.",
  cancelled: "The operation was cancelled.",
  unknown: "Something went wrong. Please try again.",
};

/**
 * Specific, friendly copy for individual Firebase Auth error codes.
 *
 * Firebase returns codes like "auth/email-already-in-use". Mapping only to a
 * broad category (as `codeFromFirebase` does) would collapse "wrong password"
 * and "no such account" into the same generic sentence — unhelpful, and it
 * would defeat the spec's duplicate-email detection. This table gives the
 * common auth failures purpose-written messages. Keys are the bare Firebase
 * code without the "auth/" prefix.
 */
const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  "email-already-in-use": "That email is already registered. Try signing in instead.",
  "invalid-email": "That email address doesn't look right.",
  "user-disabled": "This account has been disabled. Contact support if you think this is a mistake.",
  "user-not-found": "We couldn't find an account with those details.",
  "wrong-password": "Incorrect email or password.",
  // Modern Firebase collapses wrong-password / user-not-found into this for
  // account-enumeration protection.
  "invalid-credential": "Incorrect email or password.",
  "invalid-login-credentials": "Incorrect email or password.",
  "weak-password": "That password is too weak. Use at least 8 characters with a mix of letters and numbers.",
  "missing-password": "Please enter your password.",
  "too-many-requests": "Too many attempts. Please wait a moment before trying again.",
  "network-request-failed": "We couldn't reach the server. Check your connection and try again.",
  "popup-closed-by-user": "The sign-in window was closed before finishing.",
  "cancelled-popup-request": "The sign-in window was closed before finishing.",
  "popup-blocked": "Your browser blocked the sign-in popup. Allow popups and try again.",
  "account-exists-with-different-credential":
    "An account with this email already exists using a different sign-in method.",
  "requires-recent-login": "Please sign in again to complete this action.",
  "operation-not-allowed": "This sign-in method isn't enabled. Please try another.",
  "expired-action-code": "That link has expired. Please request a new one.",
  "invalid-action-code": "That link is invalid or has already been used.",
  "unauthorized-domain": "This domain isn't authorized for sign-in.",
};

/** Strip the "auth/" (or other) prefix from a Firebase code. */
function bareCode(firebaseCode: string): string {
  const slash = firebaseCode.indexOf("/");
  return (slash >= 0 ? firebaseCode.slice(slash + 1) : firebaseCode).toLowerCase();
}

/**
 * Maps a Firebase error code (e.g. "auth/user-not-found",
 * "permission-denied", "unavailable") to our internal category.
 */
function codeFromFirebase(firebaseCode: string): AppErrorCode {
  const c = firebaseCode.toLowerCase();
  if (c.includes("permission-denied")) return "permission-denied";
  if (c.startsWith("auth/") || c.includes("unauthenticated")) {
    if (c.includes("network-request-failed")) return "network";
    if (c.includes("too-many-requests")) return "rate-limited";
    if (c.includes("email-already-in-use")) return "already-exists";
    if (c.includes("user-not-found")) return "not-found";
    if (
      c.includes("wrong-password") ||
      c.includes("invalid-email") ||
      c.includes("weak-password") ||
      c.includes("missing-password") ||
      c.includes("invalid-credential") ||
      c.includes("invalid-login-credentials")
    )
      return "invalid-input";
    if (c.includes("popup-closed") || c.includes("cancelled-popup")) return "cancelled";
    return "unauthenticated";
  }
  if (c.includes("not-found")) return "not-found";
  if (c.includes("already-exists")) return "already-exists";
  if (c.includes("deadline-exceeded") || c.includes("timeout")) return "timeout";
  if (c.includes("unavailable")) return "unavailable";
  if (c.includes("cancelled")) return "cancelled";
  if (c.includes("resource-exhausted")) return "rate-limited";
  if (c.includes("invalid-argument") || c.includes("failed-precondition"))
    return "invalid-input";
  return "unknown";
}

/**
 * Normalises any thrown value into an `AppError`. Safe to call on unknown
 * catch-clause values — it never throws.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  // Firebase-style errors expose a string `code`.
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const rawCode = (error as { code: string }).code;
    const category = codeFromFirebase(rawCode);
    // Prefer a purpose-written auth message; fall back to the category default.
    // A genuine offline state still wins for network-category failures.
    if (category === "network" && typeof navigator !== "undefined" && navigator.onLine === false) {
      return new AppError("offline", USER_MESSAGES.offline, { cause: error });
    }
    const specific = FIREBASE_AUTH_MESSAGES[bareCode(rawCode)];
    return new AppError(category, specific ?? USER_MESSAGES[category], { cause: error });
  }

  // Browser offline signal (for non-coded errors, e.g. a bare fetch failure).
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return new AppError("offline", USER_MESSAGES.offline, { cause: error });
  }

  if (error instanceof Error) {
    return new AppError("unknown", USER_MESSAGES.unknown, {
      cause: error,
      message: error.message,
    });
  }

  return new AppError("unknown", USER_MESSAGES.unknown, { cause: error });
}
