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
import type { User } from "@/types";
import type { UserDoc } from "@/types/firestore";

/** Safely turn a Firestore Timestamp (or missing value) into an ISO string. */
function tsToIso(ts: Timestamp | undefined | null): string {
  if (ts && typeof ts.toDate === "function") return ts.toDate().toISOString();
  return new Date(0).toISOString();
}

/** Map a stored user document to the UI `User` shape. */
export function userDocToUser(docData: UserDoc): User {
  return {
    id: docData.uid,
    username: docData.username,
    displayName: docData.displayName,
    discriminator: docData.discriminator,
    avatarUrl: docData.avatarUrl,
    bannerColor: docData.bannerColor,
    status: docData.status ?? "online",
    customStatus: docData.customStatus,
    bio: docData.bio,
    pronouns: docData.pronouns,
    badges: docData.badges ?? [],
    createdAt: tsToIso(docData.createdAt),
  };
}
