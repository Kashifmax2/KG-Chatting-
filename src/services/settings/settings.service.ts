/**
 * SettingsService — per-user application settings.
 *
 * Backed by the `settings` collection, keyed by uid. Phase 04 seeds a minimal
 * document at signup; the full settings surface arrives in Phase 15. All
 * methods return a `Result` so callers never see a raw throw.
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/config/firebase/collections";
import type { Result, Unsubscribe } from "@/types/service";
import type { SettingsDoc } from "@/types/firestore";
import { run } from "@/services/service-utils";
import { logger } from "@/utils/logger";

const settingsRef = (uid: string) => doc(db, COLLECTIONS.settings, uid);

/** Default settings seeded for a brand-new account. */
export function defaultSettings(uid: string): Omit<SettingsDoc, "createdAt" | "updatedAt"> {
  return {
    ownerId: uid,
    theme: "system",
    locale: "en",
    notificationsEnabled: true,
  };
}

export const settingsService = {
  /** Fetch a user's settings document. */
  async get(uid: string): Promise<Result<SettingsDoc | null>> {
    return run(async () => {
      const snap = await getDoc(settingsRef(uid));
      return snap.exists() ? (snap.data() as SettingsDoc) : null;
    });
  },

  /** Create the initial settings document for a new account. */
  async create(uid: string): Promise<Result<void>> {
    return run(async () => {
      await setDoc(settingsRef(uid), {
        ...defaultSettings(uid),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  },

  /** Update part of a user's settings. */
  async update(uid: string, patch: Partial<SettingsDoc>): Promise<Result<void>> {
    return run(async () => {
      await updateDoc(settingsRef(uid), { ...patch, updatedAt: serverTimestamp() });
    });
  },

  /** Subscribe to live settings updates; returns an unsubscribe fn. */
  subscribe(uid: string, cb: (settings: SettingsDoc | null) => void): Unsubscribe {
    return onSnapshot(
      settingsRef(uid),
      (snap) => cb(snap.exists() ? (snap.data() as SettingsDoc) : null),
      (err) => logger.error("settings.subscribe failed", err)
    );
  },
} as const;
