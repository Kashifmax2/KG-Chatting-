/**
 * Application-wide constants and limits.
 *
 * Validators and services read from here so the same bounds are enforced in one
 * place. These mirror the constraints the Firestore security rules will also
 * enforce server-side — never trust the client alone.
 */

/** Text input length bounds. */
export const LIMITS = {
  username: { min: 3, max: 32 },
  displayName: { min: 1, max: 32 },
  password: { min: 8, max: 128 },
  bio: { max: 190 },
  customStatus: { max: 128 },
  message: { max: 4000 },
  serverName: { min: 2, max: 100 },
  channelName: { min: 1, max: 100 },
  url: { max: 256 },
  socialLabel: { max: 32 },
  socialLinks: { max: 5 },
  country: { max: 56 },
  language: { max: 56 },
} as const;

/** Profile-related rules. */
export const PROFILE = {
  /** Minimum time between username changes ("cannot change too frequently"). */
  usernameChangeCooldownMs: 14 * 24 * 60 * 60 * 1000, // 14 days
} as const;

/** Upload constraints (bytes). Enforced client-side and in Storage rules. */
export const UPLOAD = {
  image: {
    maxBytes: 8 * 1024 * 1024, // 8 MB
    accept: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  },
  avatar: {
    maxBytes: 4 * 1024 * 1024, // 4 MB
    accept: ["image/png", "image/jpeg", "image/webp"],
  },
  banner: {
    maxBytes: 8 * 1024 * 1024, // 8 MB
    accept: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  },
  video: {
    maxBytes: 50 * 1024 * 1024, // 50 MB
    accept: ["video/mp4", "video/webm"],
  },
  audio: {
    maxBytes: 10 * 1024 * 1024, // 10 MB
    accept: ["audio/webm", "audio/mpeg", "audio/ogg"],
  },
} as const;

/** Default retry/backoff behaviour for transient failures. */
export const RETRY = {
  attempts: 3,
  baseDelayMs: 300,
  maxDelayMs: 4000,
} as const;

/** localStorage / persisted store keys, centralized to avoid collisions. */
export const STORAGE_KEYS = {
  auth: "kg-auth",
  theme: "kg-theme",
} as const;
