/**
 * UserService — user profile documents in Firestore.
 *
 * Reads and writes to the `users` collection. A user document is keyed by the
 * Firebase Auth uid. Profile mutations validate input upstream and are further
 * constrained by Firestore security rules (a user may only write their own
 * document). All methods return a `Result` so callers never see a raw throw.
 */
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  limit,
  documentId,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/config/firebase/collections";
import type { Result, Unsubscribe } from "@/types/service";
import type { UserDoc } from "@/types/firestore";
import { run } from "@/services/service-utils";
import { logger } from "@/utils/logger";

const usersCol = () => collection(db, COLLECTIONS.users);
const userRef = (uid: string) => doc(db, COLLECTIONS.users, uid);

export const userService = {
  /** Fetch a single user document by uid. */
  async getUser(uid: string): Promise<Result<UserDoc | null>> {
    return run(async () => {
      const snap = await getDoc(userRef(uid));
      return snap.exists() ? (snap.data() as UserDoc) : null;
    });
  },

  /** Fetch several user documents by uid (chunked to Firestore's `in` limit). */
  async getUsers(uids: string[]): Promise<Result<UserDoc[]>> {
    return run(async () => {
      if (uids.length === 0) return [];
      const chunks: string[][] = [];
      for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
      const results: UserDoc[] = [];
      for (const chunk of chunks) {
        const q = query(usersCol(), where(documentId(), "in", chunk));
        const snap = await getDocs(q);
        snap.forEach((d) => results.push(d.data() as UserDoc));
      }
      return results;
    });
  },

  /**
   * Create the initial profile document for a new account. Uses the uid as the
   * document id and stamps server timestamps for auditing fields.
   */
  async createProfile(data: UserDoc): Promise<Result<UserDoc>> {
    return run(async () => {
      await setDoc(userRef(data.uid), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });
      return data;
    });
  },

  /** Update mutable fields of the current user's profile. */
  async updateProfile(uid: string, patch: Partial<UserDoc>): Promise<Result<void>> {
    return run(async () => {
      await updateDoc(userRef(uid), { ...patch, updatedAt: serverTimestamp() });
    });
  },

  /**
   * Look up a user by their unique (case-insensitive) username. Matches against
   * the denormalised `usernameLower` field.
   */
  async findByUsername(username: string): Promise<Result<UserDoc | null>> {
    return run(async () => {
      const q = query(
        usersCol(),
        where("usernameLower", "==", username.trim().toLowerCase()),
        limit(1)
      );
      const snap = await getDocs(q);
      return snap.empty ? null : (snap.docs[0].data() as UserDoc);
    });
  },

  /** Subscribe to live updates for a user document; returns an unsubscribe fn. */
  subscribeToUser(uid: string, cb: (user: UserDoc | null) => void): Unsubscribe {
    return onSnapshot(
      userRef(uid),
      (snap) => cb(snap.exists() ? (snap.data() as UserDoc) : null),
      (err) => logger.error("subscribeToUser failed", err)
    );
  },
} as const;
