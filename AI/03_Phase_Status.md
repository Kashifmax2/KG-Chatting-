# KG Chating — Phase Status

_Last updated: 2026-07-28_

## Progress

| Phase | Title | Status |
|-------|-------|-----------|
| Phase 01 | Frontend Foundation / UI | ✅ Completed |
| Phase 02 | TypeScript Build Cleanup | ✅ Completed |
| Phase 03 | Backend Foundation | ✅ Completed |
| Phase 04 | Authentication | ✅ Completed |
| Phase 05 | User Profile | ✅ Completed (✅ Build · ✅ Browser Tested · ✅ Firebase Tested) |
| Phase 06 | Friends System | ✅ Completed (✅ Build · ⬜ Browser Tested · ⬜ Firebase Tested) |
| Phase 07 | Presence System | ⏳ Next |

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
- **Friends system live (Phase 06)** — the friends UI runs on the real social graph; the mock `friends` array no longer backs any screen. See the Phase 06 section below.
- **UI design untouched** — login/register pages wired to real auth but keep the same layout/animations. The friends page keeps its existing layout/animations; only its data source changed.
- **Other stores untouched** — `chat-store`, `notifications-store`, `ui-store` still run on mock data (Phase 08+).
- **Mock data intact** — `src/data/*` still backs everything except auth, the signed-in user's profile, and the friends graph. DM threads (`data/dms`) remain mock until Phase 08.

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

## Phase 06 — Friends System (code complete)

Send/accept/decline/cancel requests, friends list, favorites, nickname/note metadata, blocking, all realtime — per `06_Friends_System.md`. `npm run build` and `tsc -b` pass; ESLint clean on all touched files. Not yet browser- or Firebase-verified (no emulator/live run this pass).

- **Data model** — a friendship is a **dual-doc mirror**: two directed edges in `friends` keyed `{ownerId}_{userId}`, one per user, so each side reads only its own edges (`ownerId == uid`) with no composite fan-out. Requests live in `friend_requests` (`{fromId}_{toId}`, `status` of `pending`/`accepted`/`declined`/`cancelled`). Blocks live in `blocked_users` (`{ownerId}_{targetId}`). Doc types in `src/types/firestore.ts`.
- **Service** — `src/services/friends/friend.service.ts` implemented against Firestore (replacing the Phase 03 scaffold). `sendRequest` resolves username → uid via `userService.findByUsername`, and enforces the recipient's `privacy.friendRequests` setting (both `friends` and `nobody` refuse a non-friend request, returned as a generic non-probeable refusal) plus block checks in both directions. Accept/remove/block use `writeBatch` to keep both mirror edges consistent. The service also writes best-effort `notifications` docs (`type: "friend_request"`) on request/accept — failures are swallowed and logged, so notification writes never block the core action; richer notification wiring is Phase 13. Four `subscribeTo*` helpers return `onSnapshot` unsubscribes.
- **Store** — `src/stores/friends-store.ts` (UI → store → `friendService` → Firebase). A single **ref-counted, idempotent** `subscribe(uid)` opens four listeners (friends / incoming / outgoing / blocked); multiple mounts (friends page + invite modal) share one listener set and only tear down at zero refs. Because docs carry only uids, the store hydrates a `profiles` cache (uid → UI `User`) via `userService.getUsers`, replacing the old mock `getUser()` lookups. Actions: `sendRequest`, `acceptRequest`, `declineRequest`, `cancelRequest`, `removeFriend`, `blockUser`, `unblockUser`, `setNickname`, `setNote`, `toggleFavorite`. Selector hooks: `useFriends`, `useOnlineFriends`, `usePendingRequests`, `useBlockedUsers`, `usePendingIncomingCount`.
- **UI** — `src/pages/friends-page.tsx` rewritten onto the store: Online/All/Pending/Blocked/Add tabs, search, favorites-first sort, loading skeletons, an incoming-request badge, right-click context menu **and** a matching ⋯ dropdown (View Profile / Message / favorite / Copy Username / Remove Friend / Block), accept/decline/cancel controls, and a shared `ConfirmDialog` (`src/components/shared/confirm-dialog.tsx`) for remove/block. `invite-modal.tsx` migrated off the mock `friends` array onto `useFriends()`.
- **Rules + indexes** — `firestore.rules`: `friends` create/delete allowed to either edge party (mirroring), update owner-only; `blocked_users` + `friend_settings` owner-private; `notifications` corrected to `ownerId`. `firestore.indexes.json` realigned `friends`/`notifications` to `ownerId` and added `friend_requests` status composites. Rules **not emulator-verified** this pass — confirm on `firebase deploy` or via emulators.

### Phase 06 — browser-report fixes (2026-07-28)

Addressed `AI/Phase_06_Browser_Bug_Report.md`:
- **Username-only display** — the Friends list secondary line no longer renders the Discord-style `username#discriminator` (the spec doesn't require discriminators); it shows the custom status when set, otherwise the plain username. The shared profile-popup (used across other phases) was left untouched.
- **Working Unblock** — the blocked-row action is now an explicit labeled **Unblock** button (was an ambiguous hover-only `×`), plus an Unblock item in the blocked-row context menu. The store→service→rules path (`unblockUser` → `deleteDoc(blockRef)`; `blocked_users` delete allowed to owner) was already correct.
- **Working friend actions menu** — the ⋯ three-dot button was dead (no handler); it's now a real `DropdownMenu` sharing one `RowAction[]` model with the right-click `ContextMenu`, so both expose View Profile, Message, Add/Remove Favorite, Copy Username, Remove Friend, and Block. View Profile anchors the existing profile popup off the row.
- **UI polish (Friends only)** — row layout/padding/alignment reworked (whole row is one profile-open target, avatar left, actions right), avatar + status-dot sizing kept consistent, search bar gained a leading icon and a clear button, hover/active/open states on action buttons, tab section labels corrected (`All Friends`/`Online`/`Pending`/`Blocked`), skeletons and empty states retained. Design language unchanged; no other phase's UI touched.

### Phase 06 — browser-report fixes, round 2 (2026-07-28)

Addressed `AI/Phase_06_Browser_Bug_Report_02.md`:
- **Username consistency (global)** — dropped the `username#discriminator` display everywhere it remained: the dashboard footer (`user-panel.tsx`), the shared profile popup (`profile-popup.tsx`), and the profile page (`profile-page.tsx`) now all show the plain `username`, matching the Friends list. The `discriminator` field still exists on the data model; it's simply no longer surfaced (the spec never required it).
- **Profile-popup menu wired** — the popup card's ⋯ button and quick add-friend button were decorative. `ProfilePopupCard` now takes optional `onAddFriend` + `actions[]` and renders a real `DropdownMenu`; `profile-popup-overlay.tsx` builds friend-aware actions (Copy Username always; Remove Friend when already a friend; Block; quick Add Friend for non-friends) and subscribes (ref-counted) to the friends store so relationship state is correct wherever the popup opens.
- **Message button opens/creates a DM** — added `src/stores/dm-store.ts`: a runtime DM channel list + participant-profile cache seeded (cloned) from the frozen mock data. `openOrCreateDM(user)` returns an existing 1:1 channel id or creates one, then callers navigate to `/dm/:id`. Wired into the profile popup, the friends-list Message action, `dm-page.tsx` (resolves channels/users from the store, so freshly-created DMs render), and `home-sidebar.tsx` (lists store channels, so new DMs appear immediately).
- **Footer layout** — `user-panel.tsx` spacing/alignment/responsiveness improved; the secondary status/username line is no longer awkwardly truncated against the control cluster. Design language unchanged.
- **Unblock** — left as-is per the report's note (block removes the friendship; unblock only removes the block; re-sending a request afterward is expected).

### Phase 06 — browser-report fixes, round 3 (2026-07-28)

Addressed `AI/Phase_06_Browser_Bug_Report` (final):
- **Popup ⋯ menu now opens** — the dropdown content rendered at the primitive's `z-50` but the popup backdrop is `z-[60]`, so the menu opened *behind* the backdrop and was invisible/unclickable. Bumped the popup's `DropdownMenuContent` to `z-[70]`.
- **Popup identity line** — removed the `username` shown under the display name. The popup now shows the custom status below the name when present, otherwise nothing (matching Discord). Username remains available in profile editing, account settings, search, and add-friend — just not in the View Profile popup.

## Not Done Yet — Phase 06 boundaries

- **Client-side request throttle** — `src/services/friends/friend-rate-limiter.ts` (rolling 1-min window, localStorage-backed) mirrors the login throttle. Best-effort UX guard only; real enforcement needs Firestore rules + Cloud Functions (Phase 17/18).
- **DM from friends** — the "Message" action now opens-or-creates a DM via the client-side `dm-store` (seeded from mock data) and navigates to it. This is a runtime-only stand-in so the friends flow is functional; the Firestore-backed, persistent, real-time DM system (messages, delivery, cross-device sync) still lands in Phase 08. Created DMs live only for the session.
- **Presence** — Online/online-status uses the static `status` field on the profile; live presence is Phase 07.
- **Notifications on friend events** — the service writes best-effort `notifications` docs on request/accept, but there's no notification UI/store consuming them yet, and other friend events (decline/block) don't notify. Full notification handling is Phase 13.
- **Privacy enforcement** — `privacy.friendRequests` is now enforced at send time (client-side, best-effort — a determined client bypasses it until mirrored into rules/Functions in Phase 17/18). Profile/status/activity visibility is still deferred to the features that consume them.

## Next: Phase 07 — Presence System (NOT STARTED — awaiting approval)

Realtime online/offline/idle presence via RTDB + Firestore mirror, per `07_Presence_System.md`. No Phase 07 code has been written.
