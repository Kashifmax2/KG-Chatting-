/**
 * FriendService — friendships, friend requests, and blocks (Phase 06).
 *
 * Backed by four collections: `friends` (dual-doc mirror — one directed edge
 * per user), `friend_requests`, `blocked_users`, and `friend_settings`. Every
 * list query is keyed by `ownerId == uid` so a user only ever reads their own
 * edges; Firestore rules enforce the same. Any transition that touches more
 * than one document runs in a batch so a friendship can never exist on one
 * side only.
 *
 * Layering: components never touch this directly — UI → store → this service →
 * Firebase. Methods return a `Result<T>` and never throw across the boundary.
 */
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/config/firebase/collections";
import type { Result, Unsubscribe } from "@/types/service";
import type {
  BlockedUserDoc,
  FriendDoc,
  FriendRequestDoc,
} from "@/types/firestore";
import { run } from "@/services/service-utils";
import { AppError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { userService } from "@/services/users/user.service";

// ---- Collection / document helpers ---------------------------------------

const friendsCol = () => collection(db, COLLECTIONS.friends);
const requestsCol = () => collection(db, COLLECTIONS.friendRequests);
const blockedCol = () => collection(db, COLLECTIONS.blockedUsers);
const notificationsCol = () => collection(db, COLLECTIONS.notifications);

/** Deterministic id for a directed friend edge owned by `ownerId`. */
const friendEdgeId = (ownerId: string, userId: string) => `${ownerId}_${userId}`;
/** Deterministic id for a directed request from → to (blocks duplicates). */
const makeRequestId = (fromId: string, toId: string) => `${fromId}_${toId}`;
/** Deterministic id for a block owned by `ownerId` against `targetId`. */
const makeBlockId = (ownerId: string, targetId: string) => `${ownerId}_${targetId}`;

const friendEdgeRef = (ownerId: string, userId: string) =>
  doc(db, COLLECTIONS.friends, friendEdgeId(ownerId, userId));
const requestRef = (fromId: string, toId: string) =>
  doc(db, COLLECTIONS.friendRequests, makeRequestId(fromId, toId));
const blockRef = (ownerId: string, targetId: string) =>
  doc(db, COLLECTIONS.blockedUsers, makeBlockId(ownerId, targetId));

// ---- Internal read helpers ------------------------------------------------

/** Are `a` and `b` already friends (checks a's own edge)? */
async function areFriends(a: string, b: string): Promise<boolean> {
  const snap = await getDoc(friendEdgeRef(a, b));
  return snap.exists();
}

/** Is there a live (pending) request in the given direction? */
async function hasPendingRequest(fromId: string, toId: string): Promise<boolean> {
  const snap = await getDoc(requestRef(fromId, toId));
  return snap.exists() && (snap.data() as FriendRequestDoc).status === "pending";
}

/** Has `ownerId` blocked `targetId`? */
async function hasBlocked(ownerId: string, targetId: string): Promise<boolean> {
  const snap = await getDoc(blockRef(ownerId, targetId));
  return snap.exists();
}

/**
 * Write a friend-related notification for `recipientId`. Best-effort: the
 * Notification System (Phase 13) owns the read UI; here we only persist the
 * doc so the data is correct when that phase lands. A failure never fails the
 * originating action.
 */
async function writeNotification(
  recipientId: string,
  actorId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    await setDoc(doc(notificationsCol()), {
      ownerId: recipientId,
      type: "friend_request",
      title,
      body,
      actorId,
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    logger.error("friend notification write failed", err);
  }
}

/** Establish the mutual friendship edges + resolve the request, atomically. */
async function commitAccept(fromId: string, toId: string): Promise<void> {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  // `fromId` sent the request; `toId` accepted. Create both directed edges.
  batch.set(friendEdgeRef(fromId, toId), {
    ownerId: fromId,
    userId: toId,
    status: "accepted",
    favorite: false,
    since: now,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(friendEdgeRef(toId, fromId), {
    ownerId: toId,
    userId: fromId,
    status: "accepted",
    favorite: false,
    since: now,
    createdAt: now,
    updatedAt: now,
  });
  batch.update(requestRef(fromId, toId), { status: "accepted", updatedAt: now });
  await batch.commit();
}

export const friendService = {
  // ---- Requests -----------------------------------------------------------

  /**
   * Send a friend request from `fromUid` to the user with `toUsername`. Guards
   * against self-requests, unknown users, existing friendships, duplicate
   * pending requests (either direction), and blocks (either direction). If the
   * other user already has a pending request to us, this accepts it instead of
   * creating a mirror request.
   */
  async sendRequest(fromUid: string, toUsername: string): Promise<Result<void>> {
    return run(async () => {
      const lookup = await userService.findByUsername(toUsername);
      if (!lookup.ok) throw new AppError(lookup.error.code === "not-found" ? "not-found" : "unknown", lookup.error.message);
      const target = lookup.data;
      if (!target) {
        throw new AppError("not-found", `We couldn't find a user named "${toUsername}".`);
      }
      const toUid = target.uid;

      if (toUid === fromUid) {
        throw new AppError("invalid-input", "You can't send a friend request to yourself.");
      }
      if (await hasBlocked(fromUid, toUid)) {
        throw new AppError("invalid-input", "You've blocked this user. Unblock them to add them.");
      }
      if (await hasBlocked(toUid, fromUid)) {
        // Don't reveal the block — behave like a generic refusal.
        throw new AppError("permission-denied", "This user isn't accepting requests from you.");
      }
      if (await areFriends(fromUid, toUid)) {
        throw new AppError("already-exists", `You're already friends with ${target.displayName}.`);
      }
      // Enforce the recipient's friend-request privacy setting (Phase 05
      // deferred this to here). `nobody` refuses outright; `friends` means only
      // existing friends may ask — and by definition we aren't one yet. In both
      // cases behave like a generic refusal so the setting isn't probeable.
      const level = target.privacy?.friendRequests ?? "everyone";
      if (level !== "everyone") {
        throw new AppError("permission-denied", "This user isn't accepting friend requests.");
      }
      // They already asked us — accept instead of creating a mirror request.
      if (await hasPendingRequest(toUid, fromUid)) {
        await commitAccept(toUid, fromUid);
        await writeNotification(toUid, fromUid, "Friend request accepted", `You are now friends.`);
        return;
      }
      if (await hasPendingRequest(fromUid, toUid)) {
        throw new AppError("already-exists", "You've already sent this user a request.");
      }

      const now = serverTimestamp();
      await setDoc(requestRef(fromUid, toUid), {
        fromId: fromUid,
        toId: toUid,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
      await writeNotification(toUid, fromUid, "New friend request", "Someone wants to be your friend.");
    });
  },

  /**
   * Accept an incoming request. `toUid` (the accepting user) must be the
   * recipient of the pending request from `fromUid`.
   */
  async acceptRequest(fromUid: string, toUid: string): Promise<Result<void>> {
    return run(async () => {
      const snap = await getDoc(requestRef(fromUid, toUid));
      if (!snap.exists() || (snap.data() as FriendRequestDoc).status !== "pending") {
        throw new AppError("not-found", "This friend request is no longer available.");
      }
      await commitAccept(fromUid, toUid);
      await writeNotification(fromUid, toUid, "Friend request accepted", "Your friend request was accepted.");
    });
  },

  /**
   * Decline an incoming request (recipient action). Marks it declined so it
   * drops out of pending queries on both sides.
   */
  async declineRequest(fromUid: string, toUid: string): Promise<Result<void>> {
    return run(async () => {
      await updateDoc(requestRef(fromUid, toUid), {
        status: "declined",
        updatedAt: serverTimestamp(),
      });
    });
  },

  /** Cancel an outgoing request (sender action). */
  async cancelRequest(fromUid: string, toUid: string): Promise<Result<void>> {
    return run(async () => {
      await updateDoc(requestRef(fromUid, toUid), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
    });
  },

  // ---- Friendships --------------------------------------------------------

  /** Remove an existing friend — deletes both directed edges atomically. */
  async removeFriend(uid: string, friendUid: string): Promise<Result<void>> {
    return run(async () => {
      const batch = writeBatch(db);
      batch.delete(friendEdgeRef(uid, friendUid));
      batch.delete(friendEdgeRef(friendUid, uid));
      await batch.commit();
    });
  },

  /** Update owner-private metadata on the caller's own friend edge. */
  async updateFriendMeta(
    uid: string,
    friendUid: string,
    patch: Partial<Pick<FriendDoc, "nickname" | "note" | "favorite">>
  ): Promise<Result<void>> {
    return run(async () => {
      await updateDoc(friendEdgeRef(uid, friendUid), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    });
  },

  // ---- Blocking -----------------------------------------------------------

  /**
   * Block `targetUid`: create the block edge, tear down any friendship, and
   * cancel any pending request in either direction — all atomically.
   */
  async blockUser(uid: string, targetUid: string): Promise<Result<void>> {
    return run(async () => {
      if (uid === targetUid) {
        throw new AppError("invalid-input", "You can't block yourself.");
      }
      // Pre-read which requests actually exist so we only update real docs
      // (a `set` on a missing request would create a malformed one and the
      // create rule requires fromId == the caller anyway).
      const [outSnap, inSnap] = await Promise.all([
        getDoc(requestRef(uid, targetUid)),
        getDoc(requestRef(targetUid, uid)),
      ]);
      const now = serverTimestamp();
      const batch = writeBatch(db);
      batch.set(blockRef(uid, targetUid), {
        ownerId: uid,
        targetId: targetUid,
        createdAt: now,
        updatedAt: now,
      });
      // Drop the friendship if it exists (both edges).
      batch.delete(friendEdgeRef(uid, targetUid));
      batch.delete(friendEdgeRef(targetUid, uid));
      // Cancel any pending request either way (only if the doc exists).
      if (outSnap.exists()) {
        batch.update(requestRef(uid, targetUid), { status: "cancelled", updatedAt: now });
      }
      if (inSnap.exists()) {
        batch.update(requestRef(targetUid, uid), { status: "declined", updatedAt: now });
      }
      await batch.commit();
    });
  },

  /** Unblock a user — removes the block edge. */
  async unblockUser(uid: string, targetUid: string): Promise<Result<void>> {
    return run(async () => {
      await deleteDoc(blockRef(uid, targetUid));
    });
  },

  // ---- One-shot reads -----------------------------------------------------

  /** List the current user's friends (own edges only). */
  async listFriends(uid: string): Promise<Result<FriendDoc[]>> {
    return run(async () => {
      const snap = await getDocs(query(friendsCol(), where("ownerId", "==", uid)));
      return snap.docs.map((d) => d.data() as FriendDoc);
    });
  },

  // ---- Realtime subscriptions --------------------------------------------

  /** Subscribe to the current user's friend edges. */
  subscribeToFriends(uid: string, cb: (friends: FriendDoc[]) => void): Unsubscribe {
    return onSnapshot(
      query(friendsCol(), where("ownerId", "==", uid)),
      (snap) => cb(snap.docs.map((d) => d.data() as FriendDoc)),
      (err) => logger.error("subscribeToFriends failed", err)
    );
  },

  /** Subscribe to incoming pending requests (where I'm the recipient). */
  subscribeToIncomingRequests(
    uid: string,
    cb: (requests: FriendRequestDoc[]) => void
  ): Unsubscribe {
    return onSnapshot(
      query(requestsCol(), where("toId", "==", uid), where("status", "==", "pending")),
      (snap) => cb(snap.docs.map((d) => d.data() as FriendRequestDoc)),
      (err) => logger.error("subscribeToIncomingRequests failed", err)
    );
  },

  /** Subscribe to outgoing pending requests (where I'm the sender). */
  subscribeToOutgoingRequests(
    uid: string,
    cb: (requests: FriendRequestDoc[]) => void
  ): Unsubscribe {
    return onSnapshot(
      query(requestsCol(), where("fromId", "==", uid), where("status", "==", "pending")),
      (snap) => cb(snap.docs.map((d) => d.data() as FriendRequestDoc)),
      (err) => logger.error("subscribeToOutgoingRequests failed", err)
    );
  },

  /** Subscribe to the users the current user has blocked. */
  subscribeToBlocked(
    uid: string,
    cb: (blocked: BlockedUserDoc[]) => void
  ): Unsubscribe {
    return onSnapshot(
      query(blockedCol(), where("ownerId", "==", uid)),
      (snap) => cb(snap.docs.map((d) => d.data() as BlockedUserDoc)),
      (err) => logger.error("subscribeToBlocked failed", err)
    );
  },
} as const;
