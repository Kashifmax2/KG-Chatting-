/**
 * ProfileStore — owns editing of the signed-in user's own profile.
 *
 * Layering: UI → this store → services (userService / cloudinaryService) →
 * Firebase. Components never call the services directly.
 *
 * Realtime sync: `subscribe()` opens a single live listener on the user's own
 * document and pushes every change into the auth store's `user`, so any edit
 * (from this tab, another tab, or another device) reflects instantly without a
 * refresh. There is exactly one listener; `subscribe()` is idempotent.
 */
import { create } from "zustand";
import type { ProfilePrivacy, SocialLink, User } from "@/types";
import type { UserDoc } from "@/types/firestore";
import type { MediaKind } from "@/services/cloudinary/cloudinary.service";
import { userService } from "@/services/users/user.service";
import { cloudinaryService } from "@/services/cloudinary/cloudinary.service";
import { useAuthStore } from "@/stores/auth-store";
import { userDocToUser } from "@/services/auth/auth-mapper";
import {
  checkUsernameAvailable,
  toUsernameLower,
  usernameChangeRemainingMs,
  formatCooldown,
} from "@/services/users/username";
import { validateUsername } from "@/validators";
import { deleteField, serverTimestamp, type Unsubscribe } from "firebase/firestore";

/** Fields a user may edit about themselves (excludes username — see below). */
export interface ProfileEditableFields {
  displayName: string;
  bio: string;
  pronouns: string;
  customStatus: string;
  bannerColor: string;
  accentColor: string;
  country: string;
  language: string;
  website: string;
  socialLinks: SocialLink[];
  privacy: ProfilePrivacy;
}

interface ProfileState {
  /** True while a save/upload is in flight. */
  saving: boolean;
  /** True while an avatar/banner upload is in flight. */
  uploading: boolean;
  /** Last error, safe to show in the UI. */
  error: string | null;

  /** Live listener handle for the current user's own document. */
  _unsub: Unsubscribe | null;
  /** uid currently subscribed, to keep `subscribe` idempotent. */
  _subscribedUid: string | null;

  /** Open the realtime listener for `uid` (idempotent). Returns cleanup. */
  subscribe: (uid: string) => Unsubscribe;
  /** Tear down the realtime listener. */
  unsubscribe: () => void;

  /** Patch mutable profile fields. Returns true on success. */
  updateProfile: (patch: Partial<ProfileEditableFields>) => Promise<boolean>;
  /** Change username with content, uniqueness and frequency checks. */
  changeUsername: (username: string) => Promise<boolean>;
  /** Upload and set a new avatar. Returns true on success. */
  uploadAvatar: (file: File) => Promise<boolean>;
  /** Upload and set a new banner image. Returns true on success. */
  uploadBanner: (file: File) => Promise<boolean>;
  /** Remove the current avatar (falls back to the default asset). */
  removeAvatar: () => Promise<boolean>;
  /** Remove the current banner image (falls back to the banner colour). */
  removeBanner: () => Promise<boolean>;

  clearError: () => void;
}

/** The uid of the signed-in user, or null. */
function currentUid(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

/** Push a freshly-read document into the auth store as the canonical user. */
function pushUser(user: User) {
  useAuthStore.getState().setUser(user);
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  saving: false,
  uploading: false,
  error: null,
  _unsub: null,
  _subscribedUid: null,

  subscribe: (uid) => {
    const state = get();
    // Already listening to this user — hand back a matching cleanup.
    if (state._subscribedUid === uid && state._unsub) {
      return () => get().unsubscribe();
    }
    // Switching users: drop the old listener first.
    state._unsub?.();

    const unsub = userService.subscribeToUser(uid, (docData) => {
      if (docData) pushUser(userDocToUser(docData as UserDoc));
    });
    set({ _unsub: unsub, _subscribedUid: uid });
    return () => get().unsubscribe();
  },

  unsubscribe: () => {
    get()._unsub?.();
    set({ _unsub: null, _subscribedUid: null });
  },

  updateProfile: async (patch) => {
    const uid = currentUid();
    if (!uid) {
      set({ error: "You need to be signed in to edit your profile." });
      return false;
    }
    set({ saving: true, error: null });

    // Only forward defined keys; normalise empty optional strings to omit them.
    const docPatch: Partial<UserDoc> = {};
    if (patch.displayName !== undefined) docPatch.displayName = patch.displayName.trim();
    if (patch.bio !== undefined) docPatch.bio = patch.bio.trim();
    if (patch.pronouns !== undefined) docPatch.pronouns = patch.pronouns.trim();
    if (patch.customStatus !== undefined) docPatch.customStatus = patch.customStatus.trim();
    if (patch.bannerColor !== undefined) docPatch.bannerColor = patch.bannerColor.trim();
    if (patch.accentColor !== undefined) docPatch.accentColor = patch.accentColor.trim();
    if (patch.country !== undefined) docPatch.country = patch.country.trim();
    if (patch.language !== undefined) docPatch.language = patch.language.trim();
    if (patch.website !== undefined) docPatch.website = patch.website.trim();
    if (patch.socialLinks !== undefined) docPatch.socialLinks = patch.socialLinks;
    if (patch.privacy !== undefined) docPatch.privacy = patch.privacy;

    const res = await userService.updateProfile(uid, docPatch);
    set({ saving: false });
    if (!res.ok) {
      set({ error: res.error.message });
      return false;
    }
    // The realtime listener will reconcile; optimistically reflect locally too.
    const current = useAuthStore.getState().user;
    if (current) pushUser({ ...current, ...stripForUi(patch) });
    return true;
  },

  changeUsername: async (username) => {
    const uid = currentUid();
    if (!uid) {
      set({ error: "You need to be signed in to change your username." });
      return false;
    }
    set({ saving: true, error: null });

    const trimmed = username.trim();
    // 1. Content rules.
    const format = validateUsername(trimmed);
    if (!format.ok) {
      set({ saving: false, error: format.message });
      return false;
    }

    // 2. Frequency guard — read the current doc for the last-change timestamp.
    const docRes = await userService.getUser(uid);
    if (!docRes.ok) {
      set({ saving: false, error: docRes.error.message });
      return false;
    }
    const doc = docRes.data;
    // No-op if unchanged (case-insensitive).
    if (doc && toUsernameLower(doc.username) === toUsernameLower(trimmed)) {
      set({ saving: false });
      return true;
    }
    const remaining = usernameChangeRemainingMs(doc?.usernameLastChangedAt);
    if (remaining > 0) {
      set({
        saving: false,
        error: `You can change your username again in ${formatCooldown(remaining)}.`,
      });
      return false;
    }

    // 3. Uniqueness + reserved/profanity screen.
    const availability = await checkUsernameAvailable(trimmed);
    if (!availability.ok) {
      set({ saving: false, error: availability.message });
      return false;
    }

    // 4. Persist, stamping the change time so the cooldown starts.
    const res = await userService.updateProfile(uid, {
      username: trimmed,
      usernameLower: toUsernameLower(trimmed),
      usernameLastChangedAt: serverTimestamp() as unknown as UserDoc["usernameLastChangedAt"],
    });
    set({ saving: false });
    if (!res.ok) {
      set({ error: res.error.message });
      return false;
    }
    const current = useAuthStore.getState().user;
    if (current) pushUser({ ...current, username: trimmed });
    return true;
  },

  uploadAvatar: (file) => uploadImage(set, "avatar", file),
  uploadBanner: (file) => uploadImage(set, "banner", file),

  removeAvatar: async () => {
    const uid = currentUid();
    if (!uid) return false;
    set({ saving: true, error: null });
    const res = await userService.updateProfile(uid, {
      avatarUrl: deleteField() as unknown as UserDoc["avatarUrl"],
      avatarPublicId: deleteField() as unknown as UserDoc["avatarPublicId"],
    });
    set({ saving: false });
    if (!res.ok) {
      set({ error: res.error.message });
      return false;
    }
    const current = useAuthStore.getState().user;
    if (current) pushUser({ ...current, avatarUrl: undefined });
    return true;
  },

  removeBanner: async () => {
    const uid = currentUid();
    if (!uid) return false;
    set({ saving: true, error: null });
    const res = await userService.updateProfile(uid, {
      bannerUrl: deleteField() as unknown as UserDoc["bannerUrl"],
      bannerPublicId: deleteField() as unknown as UserDoc["bannerPublicId"],
    });
    set({ saving: false });
    if (!res.ok) {
      set({ error: res.error.message });
      return false;
    }
    const current = useAuthStore.getState().user;
    if (current) pushUser({ ...current, bannerUrl: undefined });
    return true;
  },

  clearError: () => set({ error: null }),
}));

/**
 * Shared upload path for avatar/banner: validate + upload via Cloudinary, then
 * persist the resulting URL + public id on the user document.
 */
async function uploadImage(
  set: (partial: Partial<ProfileState>) => void,
  kind: Extract<MediaKind, "avatar" | "banner">,
  file: File
): Promise<boolean> {
  const uid = currentUid();
  if (!uid) {
    set({ error: "You need to be signed in to upload." });
    return false;
  }
  set({ uploading: true, error: null });

  const upload = await cloudinaryService.upload(file, kind);
  if (!upload.ok) {
    set({ uploading: false, error: upload.error.message });
    return false;
  }

  const patch: Partial<UserDoc> =
    kind === "avatar"
      ? { avatarUrl: upload.data.secureUrl, avatarPublicId: upload.data.publicId }
      : { bannerUrl: upload.data.secureUrl, bannerPublicId: upload.data.publicId };

  const res = await userService.updateProfile(uid, patch);
  set({ uploading: false });
  if (!res.ok) {
    set({ error: res.error.message });
    return false;
  }
  const current = useAuthStore.getState().user;
  if (current) {
    pushUser(
      kind === "avatar"
        ? { ...current, avatarUrl: upload.data.secureUrl }
        : { ...current, bannerUrl: upload.data.secureUrl }
    );
  }
  return true;
}

/** Convert an editable-fields patch to the UI `User` partial for optimistic set. */
function stripForUi(patch: Partial<ProfileEditableFields>): Partial<User> {
  const out: Partial<User> = {};
  if (patch.displayName !== undefined) out.displayName = patch.displayName.trim();
  if (patch.bio !== undefined) out.bio = patch.bio.trim();
  if (patch.pronouns !== undefined) out.pronouns = patch.pronouns.trim();
  if (patch.customStatus !== undefined) out.customStatus = patch.customStatus.trim();
  if (patch.bannerColor !== undefined) out.bannerColor = patch.bannerColor.trim();
  if (patch.accentColor !== undefined) out.accentColor = patch.accentColor.trim();
  if (patch.country !== undefined) out.country = patch.country.trim();
  if (patch.language !== undefined) out.language = patch.language.trim();
  if (patch.website !== undefined) out.website = patch.website.trim();
  if (patch.socialLinks !== undefined) out.socialLinks = patch.socialLinks;
  if (patch.privacy !== undefined) out.privacy = patch.privacy;
  return out;
}
