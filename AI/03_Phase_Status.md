# KG Chating — Phase Status

_Last updated: 2026-07-27_

## Progress

| Phase | Title | Status |
|-------|-------|-----------|
| Phase 01 | Frontend Foundation / UI | ✅ Completed |
| Phase 02 | TypeScript Build Cleanup | ✅ Completed |
| Phase 03 | Backend Foundation | ✅ Completed |
| Phase 04 | Authentication | ✅ Completed |
| Phase 05 | User Profile | ✅ Completed (✅ Build · ✅ Browser Tested · ✅ Firebase Tested) |
| Phase 06 | Friends System | ⏳ Next |

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
- **User profile live (Phase 05)** — profile UI reads the live `users` document; full editor with realtime sync and Cloudinary uploads. Verified end-to-end in the browser against a live Firebase + Cloudinary project (avatar/banner upload + crop, refresh persistence, logout/login persistence, correct Firestore fields).
  - **Profile store** — `src/stores/profile-store.ts` (UI → store → `userService`/`cloudinaryService` → Firebase). Owns realtime sync via a single `subscribe(uid)` (dedupes an existing listener, returns an unsubscribe; no duplicate listeners / leaks), plus `updateProfile`, `changeUsername`, `uploadAvatar`/`uploadBanner`, `removeAvatar`/`removeBanner`, `clearError`.
  - **Editor UI** — `src/components/modals/edit-profile-modal.tsx`: tabbed (Identity / Appearance / Details / Privacy), live `ProfilePopupCard` preview of unsaved edits, inline validation, loading + error states. Wired into `profile-page.tsx` and Settings → My Account.
  - **Cropper** — `src/components/modals/image-cropper.tsx`: dependency-free canvas pan/zoom crop, outputs a sized `File` (avatar 512², banner 1024×576) before upload. No new npm dependency.
  - **Cloudinary** — unsigned upload via native fetch (`cloudinary.service.ts`, built Phase 03); config-gated at runtime, now live via `.env.local`. Persists `avatarUrl`/`bannerUrl` + `avatarPublicId`/`bannerPublicId`; removals use `deleteField()`.
  - **Username changes** — format + reserved/profanity + uniqueness screen, plus a 14-day change cooldown (`usernameChangeRemainingMs` / `usernameLastChangedAt`).
  - **Privacy** — `ProfilePrivacy` (profile/status/activity visibility + friend-request setting) with `everyone`/`friends`/`nobody` controls; stored on the user doc. These are stored preferences — enforcement lands with the features that consume them (friends in Phase 06, presence in Phase 07).
  - **Security rules** — `firestore.rules` users update now freezes trust/identity fields (`uid`, `email`, `emailVerified`, `discriminator`, `badges`, `createdAt`) via `userImmutableUnchanged()`; owner-only writes preserved. `storage.rules` already covered owner-only, image-only, size-bounded avatar/banner writes.
- **UI design untouched** — login/register pages wired to real auth but keep the same layout/animations.
- **Other stores untouched** — `chat-store`, `notifications-store`, `ui-store` still run on mock data (Phase 06+).
- **Mock data intact** — `src/data/*` still backs everything except auth and the signed-in user's profile.

## Not Done Yet (intentionally / known issues)

- **No `.env.local`** — must be created from `.env.example` with real Firebase values before auth runs live. `env.ts` throws a clear error until then. Build type-checks regardless.
- **OAuth console setup** — Google/GitHub providers + authorized domains must be enabled in the Firebase console before those buttons work at runtime.
- **Rate limiting / brute-force / profanity** now have a client-side login throttle (per-email, localStorage-backed, growing backoff) on top of Firebase's own limiter — but these remain best-effort UX guards; true enforcement needs Firestore rules + Cloud Functions (Phase 17/18).
- **Apple sign-in** is a future-ready stub that returns "coming soon" until the Apple Developer account + Firebase console config exist.
- **Username uniqueness** is a client check + best-effort; a race-proof guarantee needs a usernames index/rule. The username change cooldown (14 days) is likewise enforced client-side — a determined client could bypass it until it's mirrored into rules/Functions (Phase 17/18).
- **Firestore rules not emulator-verified** — the `firestore.rules` users guard mirrors the existing `ownerUnchanged()` pattern and was reviewed by hand, but the Firebase CLI/emulator wasn't available to compile-test it. Confirm on `firebase deploy` or via emulators.

### Phase 05 — intentionally deferred (per `05_User_Profile.md`)

- **Privacy enforcement** — visibility + friend-request settings are stored on the profile but not yet enforced; the reading features enforce them (profile/friend-request visibility in Phase 06, status/activity visibility in Phase 07).
- **Image compression** — the spec lists "Compress" for avatar/banner. The cropper downscales to a fixed output size (512² / 1024×576) and re-encodes JPEG at 0.92 quality, which bounds file size; no separate compression pass was added. Client + Storage size limits already guard the upper bound.
- **Client-side upload lazy-loading** — the spec's "Lazy load images" is satisfied for attachments (`loading="lazy"`); profile avatar/banner images are small and rendered eagerly. Can revisit if profile lists grow.
- **Offline / reconnect sync** — relies on Firestore's built-in offline cache + `onSnapshot` reconnect; not separately hardened or tested beyond the browser session.

## Next: Phase 06 — Friends System (NOT STARTED — awaiting approval)

Friend requests (send/accept/decline/cancel), friends list, blocking, realtime — per `06_Friends_System.md`. No Phase 06 code has been written; `src/services/friends/friend.service.ts` is Phase 03 deny-by-default scaffolding only.
