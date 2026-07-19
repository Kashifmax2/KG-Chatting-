/**
 * Reusable, pure input validators.
 *
 * These are the first gate on user input — used by forms and services alike.
 * They never trust the client on their own: the Firestore/Storage security
 * rules enforce the same bounds server-side. Each validator returns a
 * `ValidationResult` so callers get a machine-readable ok flag plus a
 * user-friendly message.
 */

import { LIMITS, UPLOAD } from "@/constants";

export interface ValidationResult {
  ok: boolean;
  /** User-friendly message when `ok` is false; empty when valid. */
  message: string;
}

const ok: ValidationResult = { ok: true, message: "" };
const fail = (message: string): ValidationResult => ({ ok: false, message });

// Loose RFC-5322-ish check; the real gate is the verification email.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Letters, numbers, dot and underscore only — keeps usernames URL-safe.
const USERNAME_RE = /^[a-zA-Z0-9._]+$/;

export function validateEmail(value: string): ValidationResult {
  const v = value.trim();
  if (!v) return fail("Email is required.");
  if (!EMAIL_RE.test(v)) return fail("Enter a valid email address.");
  return ok;
}

export function validateUsername(value: string): ValidationResult {
  const v = value.trim();
  if (!v) return fail("Username is required.");
  if (v.length < LIMITS.username.min)
    return fail(`Username must be at least ${LIMITS.username.min} characters.`);
  if (v.length > LIMITS.username.max)
    return fail(`Username must be at most ${LIMITS.username.max} characters.`);
  if (!USERNAME_RE.test(v))
    return fail("Username can only use letters, numbers, dots and underscores.");
  return ok;
}

export function validatePassword(value: string): ValidationResult {
  if (!value) return fail("Password is required.");
  if (value.length < LIMITS.password.min)
    return fail(`Password must be at least ${LIMITS.password.min} characters.`);
  if (value.length > LIMITS.password.max)
    return fail(`Password must be at most ${LIMITS.password.max} characters.`);
  return ok;
}

/**
 * Stricter check for NEW passwords (sign-up / reset). On top of the length
 * bounds, requires a mix of character classes so brand-new accounts can't be
 * created with trivially weak passwords. Login deliberately uses the looser
 * `validatePassword` — existing passwords predate this rule and must still work.
 */
export function validatePasswordStrength(value: string): ValidationResult {
  const base = validatePassword(value);
  if (!base.ok) return base;

  const classes = [
    /[a-z]/.test(value), // lowercase
    /[A-Z]/.test(value), // uppercase
    /[0-9]/.test(value), // digit
    /[^A-Za-z0-9]/.test(value), // symbol
  ].filter(Boolean).length;

  if (classes < 3) {
    return fail(
      "Use a stronger password — mix upper and lower case, numbers, and symbols."
    );
  }
  return ok;
}

/**
 * A 0–4 password-strength score for progress-meter UIs. Not a gate on its own
 * (that's `validatePasswordStrength`), just a hint for visual feedback.
 */
export function passwordStrengthScore(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= LIMITS.password.min) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return Math.min(score, 4);
}

export function validateDisplayName(value: string): ValidationResult {
  const v = value.trim();
  if (v.length < LIMITS.displayName.min) return fail("Display name is required.");
  if (v.length > LIMITS.displayName.max)
    return fail(`Display name must be at most ${LIMITS.displayName.max} characters.`);
  return ok;
}

export function validateBio(value: string): ValidationResult {
  if (value.length > LIMITS.bio.max)
    return fail(`Bio must be at most ${LIMITS.bio.max} characters.`);
  return ok;
}

export function validateMessage(value: string): ValidationResult {
  const v = value.trim();
  if (!v) return fail("Message cannot be empty.");
  if (value.length > LIMITS.message.max)
    return fail(`Message must be at most ${LIMITS.message.max} characters.`);
  return ok;
}

export function validateServerName(value: string): ValidationResult {
  const v = value.trim();
  if (v.length < LIMITS.serverName.min)
    return fail(`Server name must be at least ${LIMITS.serverName.min} characters.`);
  if (v.length > LIMITS.serverName.max)
    return fail(`Server name must be at most ${LIMITS.serverName.max} characters.`);
  return ok;
}

export function validateChannelName(value: string): ValidationResult {
  const v = value.trim();
  if (v.length < LIMITS.channelName.min) return fail("Channel name is required.");
  if (v.length > LIMITS.channelName.max)
    return fail(`Channel name must be at most ${LIMITS.channelName.max} characters.`);
  return ok;
}

type UploadKind = keyof typeof UPLOAD;

/** Validates a file's size and MIME type against the limits for its kind. */
export function validateUpload(file: File, kind: UploadKind): ValidationResult {
  const rules = UPLOAD[kind];
  if (!(rules.accept as readonly string[]).includes(file.type))
    return fail("That file type isn't supported.");
  if (file.size > rules.maxBytes) {
    const mb = Math.round(rules.maxBytes / (1024 * 1024));
    return fail(`File is too large. Maximum size is ${mb} MB.`);
  }
  return ok;
}
