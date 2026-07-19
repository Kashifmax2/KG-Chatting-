/**
 * User provisioning — the multi-document creation flow that runs once, right
 * after a Firebase Auth account is created (email/password or first OAuth
 * sign-in).
 *
 * Phase 04 flow (with rollback):
 *   1. users                    — the profile document (source of truth)
 *   2. settings                 — minimal seed (theme/locale/notifications)
 *   3. presence                 — minimal seed (status/lastSeen)
 *   4. notification_preferences — minimal permissive seed
 *
 * The default avatar is a static asset served from `/icons/default-avatar.png`,
 * so no upload is needed — the profile simply omits `avatarUrl` and the UI falls
 * back to that asset (matching existing behaviour). We record the intended
 * default so later phases can migrate it to Cloudinary if desired.
 *
 * Rollback: if any step fails, every document already written is deleted so a
 * half-provisioned account never lingers. The Auth account itself is deleted by
 * the caller (authService), which owns the Firebase user handle.
 *
 * Forward-compatibility: documents are intentionally minimal but use the same
 * shapes Phases 05 (profile), 07 (presence) and 13 (notifications) will extend,
 * so those phases read an existing document instead of special-casing "missing".
 */
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  type FieldValue,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/config/firebase/collections";
import type { Result } from "@/types/service";
import type { UserDoc } from "@/types/firestore";
import { run } from "@/services/service-utils";
import { logger } from "@/utils/logger";
import { toUsernameLower, generateDiscriminator } from "@/services/users/username";

/** Static default avatar asset (see AI/00_Project_Assets.md). */
export const DEFAULT_AVATAR_PATH = "/icons/default-avatar.png";

/** A stable, pleasant default banner colour for new accounts. */
const DEFAULT_BANNER_COLOR = "hsl(235 86% 65%)";

export interface ProvisionInput {
  uid: string;
  email: string;
  emailVerified: boolean;
  username: string;
  displayName: string;
  /** Optional avatar already resolved (e.g. from an OAuth provider photo). */
  avatarUrl?: string;
}

/**
 * Creates the profile + seed documents for a brand-new account. On any failure
 * it rolls back whatever was written and returns a failed `Result`.
 */
export async function provisionNewUser(
  input: ProvisionInput
): Promise<Result<UserDoc>> {
  const { uid, email, emailVerified, username, displayName, avatarUrl } = input;

  // Track which docs we created so we can undo them on failure.
  const written: Array<{ collection: string; id: string }> = [];

  const write = async (col: string, data: Record<string, unknown> & { [k: string]: unknown }) => {
    await setDoc(doc(db, col, uid), data);
    written.push({ collection: col, id: uid });
  };

  const now: FieldValue = serverTimestamp();

  // The profile's own fields, minus the audit timestamps — those are written
  // as server timestamps at persist time (below) rather than carried on the
  // typed object. `avatarUrl` is omitted when absent so the UI uses the static
  // default asset.
  const profileFields: Omit<UserDoc, "createdAt" | "updatedAt" | "lastSeen"> = {
    uid,
    username,
    usernameLower: toUsernameLower(username),
    displayName: displayName.trim() || username,
    discriminator: generateDiscriminator(uid),
    email,
    emailVerified,
    bannerColor: DEFAULT_BANNER_COLOR,
    status: "online",
    badges: [],
    ...(avatarUrl ? { avatarUrl } : {}),
  };

  try {
    // 1. Profile document (source of truth).
    await write(COLLECTIONS.users, {
      ...profileFields,
      createdAt: now,
      updatedAt: now,
      lastSeen: now,
    });

    // 2. Settings seed.
    await write(COLLECTIONS.settings, {
      ownerId: uid,
      theme: "dark",
      locale: "en",
      notificationsEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    // 3. Presence seed (Firestore snapshot; RTDB presence is wired in Phase 07).
    await write(COLLECTIONS.presence, {
      uid,
      status: "online",
      lastSeen: now,
    });

    // 4. Notification preferences seed (permissive defaults).
    await write(COLLECTIONS.notificationPrefs, {
      ownerId: uid,
      desktop: true,
      push: true,
      email: true,
      sounds: true,
      muteAll: false,
      createdAt: now,
      updatedAt: now,
    });

    // Return a UI-consumable snapshot. The audit timestamps were written as
    // server timestamps; we stamp local `Timestamp`s here purely so the mapper
    // has a value to render immediately (it re-hydrates from the listener next).
    const nowTs = Timestamp.now();
    const userDoc: UserDoc = {
      ...profileFields,
      createdAt: nowTs,
      updatedAt: nowTs,
      lastSeen: nowTs,
    };
    return run(async () => userDoc);
  } catch (error) {
    logger.error("provisionNewUser failed, rolling back", error);
    await rollback(written);
    // Surface the original error through the standard failure shape.
    return run(async () => {
      throw error;
    });
  }
}

/** Best-effort deletion of any documents written before a failure. */
async function rollback(written: Array<{ collection: string; id: string }>) {
  for (const entry of written) {
    try {
      await deleteDoc(doc(db, entry.collection, entry.id));
    } catch (err) {
      // Log and continue — we want to remove as much as possible.
      logger.error(`rollback: failed to delete ${entry.collection}/${entry.id}`, err);
    }
  }
}
