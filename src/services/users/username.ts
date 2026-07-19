/**
 * Username helpers — uniqueness, discriminator generation, and content rules.
 *
 * Username policy (aligned with Phase 05 expectations):
 *   - 3–32 characters, letters/numbers/dots/underscores only
 *   - case-insensitive uniqueness (checked against `usernameLower`)
 *   - a small reserved list and a light profanity screen are rejected
 *
 * Client-side checks are best-effort UX guards. True uniqueness is ultimately
 * enforced server-side (Firestore rules / a usernames index) — a client check
 * can always race. These helpers keep the common case fast and friendly.
 */
import { userService } from "@/services/users/user.service";
import { PROFILE } from "@/constants";
import type { Timestamp } from "firebase/firestore";

/** Names we never let a user claim — routes, roles, and system identities. */
const RESERVED_USERNAMES = new Set<string>([
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "help",
  "kg",
  "kgbot",
  "kgchating",
  "kgchatting",
  "moderator",
  "mod",
  "staff",
  "official",
  "everyone",
  "here",
  "me",
  "you",
  "null",
  "undefined",
  "settings",
  "login",
  "register",
  "friends",
  "notifications",
  "explore",
]);

/** Light profanity screen — substrings that block a username. */
const PROFANITY = ["fuck", "shit", "cunt", "nigger", "faggot", "bitch"];

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.trim().toLowerCase());
}

export function containsProfanity(value: string): boolean {
  const v = value.toLowerCase();
  return PROFANITY.some((word) => v.includes(word));
}

/** Normalised form used for case-insensitive lookups and uniqueness. */
export function toUsernameLower(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Generates a 4-digit discriminator (e.g. "0001"–"9999") from a seed string so
 * the same input is stable within a call without needing Math.random. Callers
 * that need collision handling should retry with a different seed.
 */
export function generateDiscriminator(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const n = (hash % 9999) + 1; // 1–9999, never 0000 (reserved for system)
  return String(n).padStart(4, "0");
}

export interface UsernameCheck {
  ok: boolean;
  /** User-facing reason when `ok` is false. */
  message: string;
}

/**
 * Full availability check: content rules first (cheap, offline), then a
 * remote uniqueness lookup. Returns a friendly message on the first failure.
 */
export async function checkUsernameAvailable(
  username: string
): Promise<UsernameCheck> {
  const trimmed = username.trim();
  if (isReservedUsername(trimmed)) {
    return { ok: false, message: "That username is reserved. Try another." };
  }
  if (containsProfanity(trimmed)) {
    return { ok: false, message: "That username isn't allowed. Try another." };
  }
  const existing = await userService.findByUsername(trimmed);
  if (existing.ok && existing.data) {
    return { ok: false, message: "That username is already taken." };
  }
  // If the lookup itself failed (offline/permission), surface that error.
  if (!existing.ok) {
    return { ok: false, message: existing.error.message };
  }
  return { ok: true, message: "" };
}

/**
 * Enforces the "username cannot change too frequently" rule. Returns how long
 * remains in the cooldown, given when it last changed. `null`/absent means the
 * username has never been changed and a change is allowed immediately.
 */
export function usernameChangeRemainingMs(
  lastChangedAt: Timestamp | null | undefined,
  now: number = Date.now()
): number {
  if (!lastChangedAt || typeof lastChangedAt.toDate !== "function") return 0;
  const elapsed = now - lastChangedAt.toDate().getTime();
  const remaining = PROFILE.usernameChangeCooldownMs - elapsed;
  return remaining > 0 ? remaining : 0;
}

/** Human-friendly "in N days/hours" phrasing for a remaining-cooldown span. */
export function formatCooldown(ms: number): string {
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
