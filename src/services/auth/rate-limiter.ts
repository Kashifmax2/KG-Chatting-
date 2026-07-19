/**
 * Client-side login throttle — best-effort brute-force protection.
 *
 * This is a UX-layer guard, NOT a security boundary. A determined attacker can
 * clear localStorage or hit Firebase directly, so the real protection is
 * Firebase's own `auth/too-many-requests` throttling plus (Phase 17/18) server
 * rules and Cloud Functions. What this buys us: fast, friendly feedback that
 * discourages repeated guessing from the actual app UI and keeps us from
 * hammering Firebase with doomed attempts.
 *
 * Policy: track failed attempts per email. After `MAX_ATTEMPTS` failures we
 * lock that email locally for a window that grows with each further failure
 * (capped). A successful sign-in clears the record.
 */

const STORAGE_KEY = "kg-login-throttle";
const MAX_ATTEMPTS = 5;
const BASE_LOCK_MS = 30_000; // 30s after hitting the threshold
const MAX_LOCK_MS = 15 * 60_000; // cap at 15 minutes

interface Attempt {
  /** Consecutive failed attempts. */
  count: number;
  /** Epoch ms when the current lock (if any) expires. */
  lockedUntil: number;
}

type Store = Record<string, Attempt>;

function keyFor(email: string): string {
  return email.trim().toLowerCase();
}

function readStore(): Store {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full / disabled — throttling silently degrades to no-op.
  }
}

export interface LockStatus {
  locked: boolean;
  /** Whole seconds remaining on the lock (0 when not locked). */
  retryAfterSec: number;
}

/** Is this email currently locked out? */
export function getLockStatus(email: string): LockStatus {
  const rec = readStore()[keyFor(email)];
  if (!rec) return { locked: false, retryAfterSec: 0 };
  const remaining = rec.lockedUntil - Date.now();
  if (remaining <= 0) return { locked: false, retryAfterSec: 0 };
  return { locked: true, retryAfterSec: Math.ceil(remaining / 1000) };
}

/** Record a failed attempt and return the resulting lock status. */
export function recordFailure(email: string): LockStatus {
  const store = readStore();
  const k = keyFor(email);
  const rec = store[k] ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;

  if (rec.count >= MAX_ATTEMPTS) {
    // Grow the lock with each failure past the threshold, capped.
    const over = rec.count - MAX_ATTEMPTS;
    const lockMs = Math.min(BASE_LOCK_MS * 2 ** over, MAX_LOCK_MS);
    rec.lockedUntil = Date.now() + lockMs;
  }

  store[k] = rec;
  writeStore(store);
  return getLockStatus(email);
}

/** Clear the record for an email (call on successful sign-in). */
export function clearFailures(email: string): void {
  const store = readStore();
  delete store[keyFor(email)];
  writeStore(store);
}

/** Human-friendly wait message for a locked email. */
export function lockMessage(retryAfterSec: number): string {
  if (retryAfterSec >= 60) {
    const mins = Math.ceil(retryAfterSec / 60);
    return `Too many failed attempts. Please wait about ${mins} minute${
      mins === 1 ? "" : "s"
    } before trying again.`;
  }
  return `Too many failed attempts. Please wait ${retryAfterSec} seconds before trying again.`;
}
