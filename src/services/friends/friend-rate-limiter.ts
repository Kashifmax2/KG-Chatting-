/**
 * Client-side friend-request throttle — best-effort spam protection.
 *
 * Like the login throttle (`services/auth/rate-limiter.ts`), this is a UX-layer
 * guard, NOT a security boundary: localStorage can be cleared and Firestore hit
 * directly. Real enforcement needs Firestore rules + Cloud Functions (Phase
 * 17/18). What this buys us now: it discourages someone from firing off a burst
 * of requests from the actual app UI and gives immediate, friendly feedback.
 *
 * Policy: count requests sent inside a rolling window. Past `MAX_IN_WINDOW`,
 * sending is blocked until the oldest request ages out of the window.
 */

const STORAGE_KEY = "kg-friend-request-throttle";
const WINDOW_MS = 60_000; // rolling 1-minute window
const MAX_IN_WINDOW = 8; // at most 8 requests per minute from the UI

function readTimestamps(): number[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeTimestamps(ts: number[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ts));
  } catch {
    // Storage full / disabled — throttling silently degrades to a no-op.
  }
}

/** Drop timestamps that have aged out of the rolling window. */
function fresh(now: number): number[] {
  return readTimestamps().filter((t) => now > t && now - t < WINDOW_MS);
}

export interface ThrottleStatus {
  blocked: boolean;
  /** Whole seconds until the next request is allowed (0 when not blocked). */
  retryAfterSec: number;
}

/** Would sending another request right now exceed the limit? */
export function getThrottleStatus(): ThrottleStatus {
  const now = Date.now();
  const recent = fresh(now);
  if (recent.length < MAX_IN_WINDOW) return { blocked: false, retryAfterSec: 0 };
  const oldest = Math.min(...recent);
  const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
  return { blocked: true, retryAfterSec };
}

/** Record that a request was sent. Call only after a successful send. */
export function recordRequest(): void {
  const now = Date.now();
  const recent = fresh(now);
  recent.push(now);
  writeTimestamps(recent);
}

/** Human-friendly wait message when throttled. */
export function throttleMessage(retryAfterSec: number): string {
  return `You're sending requests a bit fast. Please wait ${retryAfterSec} second${
    retryAfterSec === 1 ? "" : "s"
  } and try again.`;
}
