/**
 * Translation between backend document types and UI-facing domain types.
 *
 * Firestore returns `UserDoc` (Firebase `Timestamp` dates, `uid`, storage
 * bookkeeping). The UI consumes the `User` type from `@/types` (string dates,
 * `id`, a live `status`). Keeping this mapping in one place means the UI and
 * stores never learn about Firestore internals, preserving the
 * UI → Store → Service → Firebase layering.
 */
import type { Timestamp } from "firebase/firestore";
import type { ProfilePrivacy, User } from "@/types";
import type { UserDoc } from "@/types/firestore";

/** Safely turn a Firestore Timestamp (or missing value) into an ISO string. */
function tsToIso(ts: Timestamp | undefined | null): string {
  if (ts && typeof ts.toDate === "function") return ts.toDate().toISOString();
  return new Date(0).toISOString();
}

/**
 * Permissive privacy defaults for accounts created before privacy existed or
 * whose document predates the field. Mirrors the seed written at signup.
 */
export function defaultPrivacy(): ProfilePrivacy {
  return {
    profileVisibility: "everyone",
    statusVisibility: "everyone",
    activityVisibility: "friends",
    friendRequests: "everyone",
  };
}

/** Map a stored user document to the UI `User` shape. */
export function userDocToUser(docData: UserDoc): User {
  return {
    id: docData.uid,
    username: docData.username,
    displayName: docData.displayName,
    discriminator: docData.discriminator,
    avatarUrl: docData.avatarUrl,
    bannerUrl: docData.bannerUrl,
    bannerColor: docData.bannerColor,
    accentColor: docData.accentColor,
    status: docData.status ?? "online",
    customStatus: docData.customStatus,
    bio: docData.bio,
    pronouns: docData.pronouns,
    country: docData.country,
    language: docData.language,
    website: docData.website,
    socialLinks: docData.socialLinks ?? [],
    badges: docData.badges ?? [],
    privacy: docData.privacy ?? defaultPrivacy(),
    createdAt: tsToIso(docData.createdAt),
  };
}
