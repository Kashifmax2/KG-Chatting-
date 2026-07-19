# KG Chating — Phase Status

_Last updated: 2026-07-26_

## Progress

| Phase | Title | Status |
|-------|-------|-----------|
| Phase 01 | Frontend Foundation / UI | ✅ Completed |
| Phase 02 | TypeScript Build Cleanup | ✅ Completed |
| Phase 03 | Backend Foundation | ✅ Completed |
| Phase 04 | Authentication | ✅ Completed |
| Phase 05 | User Profile | ⏳ Next |

## Current State

- **Firebase installed** — `firebase@12.16.0` (modular Web SDK). Cloudinary uses native fetch, no SDK.
- **Config layer** — `src/config/env.ts` + `src/config/firebase/` (single guarded init exporting `app`, `auth`, `db`, `rtdb`, `storage`).
- **Foundation utilities** — errors, retry, logger, network, validators, constants, Firestore document types.
- **Security scaffolding** — `firestore.rules`, `database.rules.json`, `storage.rules`, `firestore.indexes.json`, `firebase.json` (deny-by-default).
- **Authentication live (Phase 04)** — mock auth fully removed. `authService` + `userService` + `settingsService` implemented against Firebase Auth / Firestore. No mock fallback.
  - Email/password, Google, GitHub sign-in; password reset (inline on login), email verification, remember-me (Firebase persistence), session restore via `onAuthStateChanged`.
  - Signup runs multi-document provisioning with rollback: `users` + `settings` + `presence` + `notification_prefs` seed docs; orphaned Auth account deleted on failure.
  - `auth-store` rewritten as event-driven; `AuthProvider` boots the listener and gates the tree on `authReady`; `RequireAuth` also gates on it.
  - Username uniqueness / reserved-name / profanity screen at signup.
  - **Auth hardening (2026-07-26):** friendly per-code Firebase error mapping (incl. duplicate-email detection); password-strength gate + live meter at signup; client-side login throttle / brute-force guard (`rate-limiter.ts`); retry-with-backoff on profile hydration during login + session restore; global email-verification banner with resend + "I've verified" re-check; `signInWithApple` future-ready stub.
- **UI design untouched** — login/register pages wired to real auth but keep the same layout/animations.
- **Other stores untouched** — `chat-store`, `notifications-store`, `ui-store` still run on mock data (Phase 05+).
- **Mock data intact** — `src/data/*` still backs everything except auth.

## Not Done Yet (intentionally / known issues)

- **No `.env.local`** — must be created from `.env.example` with real Firebase values before auth runs live. `env.ts` throws a clear error until then. Build type-checks regardless.
- **OAuth console setup** — Google/GitHub providers + authorized domains must be enabled in the Firebase console before those buttons work at runtime.
- **Rate limiting / brute-force / profanity** now have a client-side login throttle (per-email, localStorage-backed, growing backoff) on top of Firebase's own limiter — but these remain best-effort UX guards; true enforcement needs Firestore rules + Cloud Functions (Phase 17/18).
- **Apple sign-in** is a future-ready stub that returns "coming soon" until the Apple Developer account + Firebase console config exist.
- **Username uniqueness** is a client check + best-effort; a race-proof guarantee needs a usernames index/rule.
- **Runtime auth untested** — no live Firebase project this session; only the build/typecheck was verified.
- **profile-page still uses mock `getCurrentUser()`** — migrates in Phase 05.

## Next: Phase 05 — User Profile

Migrate profile UI to read the live `users` document; avatar/banner uploads via Cloudinary.
