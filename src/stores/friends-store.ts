/**
 * FriendsStore — the signed-in user's social graph (Phase 06).
 *
 * Layering: UI → this store → friendService → Firebase. Components never call
 * the service directly.
 *
 * Realtime sync: `subscribe(uid)` opens four live listeners (friend edges,
 * incoming requests, outgoing requests, blocks) and mirrors every change into
 * the store, so accept/decline/cancel/remove/block reflect instantly across
 * tabs and devices with no refresh. `subscribe` is idempotent — there is at
 * most one set of listeners, and switching users tears the old ones down.
 *
 * Because friend/request/block docs only carry uids, the store also keeps a
 * `profiles` cache (uid → UI `User`) hydrated from `userService`, so the UI can
 * render names/avatars without its own fetching. This is what replaces the mock
 * `getUser()` lookups the friends UI used before.
 */
import { create } from "zustand";
import type { User } from "@/types";
import type {
  BlockedUserDoc,
  FriendDoc,
  FriendRequestDoc,
  UserDoc,
} from "@/types/firestore";
import type { Unsubscribe } from "@/types/service";
import { friendService } from "@/services/friends/friend.service";
import { userService } from "@/services/users/user.service";
import { userDocToUser } from "@/services/auth/auth-mapper";
import { useAuthStore } from "@/stores/auth-store";
import {
  getThrottleStatus,
  recordRequest,
  throttleMessage,
} from "@/services/friends/friend-rate-limiter";
import { logger } from "@/utils/logger";

interface FriendsState {
  /** Accepted friend edges owned by the current user. */
  friends: FriendDoc[];
  /** Pending requests where the current user is the recipient. */
  incoming: FriendRequestDoc[];
  /** Pending requests the current user has sent. */
  outgoing: FriendRequestDoc[];
  /** Users the current user has blocked. */
  blocked: BlockedUserDoc[];
  /** uid → profile cache for everyone referenced above. */
  profiles: Record<string, User>;

  /** True until the first snapshot of every listener has arrived. */
  loading: boolean;
  /** True while a mutating action is in flight. */
  busy: boolean;
  /** Last user-facing error from an action. */
  error: string | null;

  // ---- listener bookkeeping (idempotent, ref-counted subscribe) ----
  _unsubs: Unsubscribe[];
  _subscribedUid: string | null;
  /** How many callers currently hold the shared listeners. */
  _refCount: number;
  /** Which of the four listeners have reported at least once. */
  _ready: { friends: boolean; incoming: boolean; outgoing: boolean; blocked: boolean };

  /** Open the realtime listeners for `uid` (idempotent, ref-counted). Returns cleanup. */
  subscribe: (uid: string) => Unsubscribe;
  /** Tear down all listeners and reset the graph. */
  unsubscribe: () => void;
  /** Internal: release one subscriber's hold; tears down at zero. */
  _release: () => void;

  // ---- actions (all return true on success) ----
  sendRequest: (username: string) => Promise<boolean>;
  acceptRequest: (fromUid: string) => Promise<boolean>;
  declineRequest: (fromUid: string) => Promise<boolean>;
  cancelRequest: (toUid: string) => Promise<boolean>;
  removeFriend: (friendUid: string) => Promise<boolean>;
  blockUser: (targetUid: string) => Promise<boolean>;
  unblockUser: (targetUid: string) => Promise<boolean>;
  setNickname: (friendUid: string, nickname: string) => Promise<boolean>;
  setNote: (friendUid: string, note: string) => Promise<boolean>;
  toggleFavorite: (friendUid: string) => Promise<boolean>;

  clearError: () => void;

  /** Internal: fill the profile cache for any uids not already present. */
  _hydrateProfiles: (uids: string[]) => Promise<void>;
}

/** The uid of the signed-in user, or null. */
function currentUid(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  incoming: [],
  outgoing: [],
  blocked: [],
  profiles: {},
  loading: true,
  busy: false,
  error: null,
  _unsubs: [],
  _subscribedUid: null,
  _refCount: 0,
  _ready: { friends: false, incoming: false, outgoing: false, blocked: false },

  subscribe: (uid) => {
    const state = get();
    // Already listening for this user — just add a reference and hand back a
    // cleanup that only releases this caller's hold.
    if (state._subscribedUid === uid && state._unsubs.length > 0) {
      set({ _refCount: state._refCount + 1 });
      return () => get()._release();
    }
    // Switching users (or re-subscribing): drop the old listeners first.
    state._unsubs.forEach((u) => u());

    set({
      _subscribedUid: uid,
      _refCount: 1,
      loading: true,
      _ready: { friends: false, incoming: false, outgoing: false, blocked: false },
      friends: [],
      incoming: [],
      outgoing: [],
      blocked: [],
    });

    // Mark a listener ready and clear global loading once all four have fired.
    const markReady = (key: keyof FriendsState["_ready"]) => {
      const ready = { ...get()._ready, [key]: true };
      const done = ready.friends && ready.incoming && ready.outgoing && ready.blocked;
      set({ _ready: ready, ...(done ? { loading: false } : {}) });
    };

    const unsubs: Unsubscribe[] = [
      friendService.subscribeToFriends(uid, (friends) => {
        set({ friends });
        void get()._hydrateProfiles(friends.map((f) => f.userId));
        markReady("friends");
      }),
      friendService.subscribeToIncomingRequests(uid, (incoming) => {
        set({ incoming });
        void get()._hydrateProfiles(incoming.map((r) => r.fromId));
        markReady("incoming");
      }),
      friendService.subscribeToOutgoingRequests(uid, (outgoing) => {
        set({ outgoing });
        void get()._hydrateProfiles(outgoing.map((r) => r.toId));
        markReady("outgoing");
      }),
      friendService.subscribeToBlocked(uid, (blocked) => {
        set({ blocked });
        void get()._hydrateProfiles(blocked.map((b) => b.targetId));
        markReady("blocked");
      }),
    ];

    set({ _unsubs: unsubs });
    return () => get()._release();
  },

  _release: () => {
    const next = get()._refCount - 1;
    if (next > 0) {
      set({ _refCount: next });
      return;
    }
    get().unsubscribe();
  },

  unsubscribe: () => {
    get()._unsubs.forEach((u) => u());
    set({
      _unsubs: [],
      _subscribedUid: null,
      _refCount: 0,
      friends: [],
      incoming: [],
      outgoing: [],
      blocked: [],
      loading: true,
      _ready: { friends: false, incoming: false, outgoing: false, blocked: false },
    });
  },

  sendRequest: async (username) => {
    const uid = currentUid();
    if (!uid) return false;
    const trimmed = username.trim();
    if (!trimmed) {
      set({ error: "Enter a username to send a request." });
      return false;
    }
    // Best-effort client throttle (real limiting is Phase 17/18).
    const throttle = getThrottleStatus();
    if (throttle.blocked) {
      set({ error: throttleMessage(throttle.retryAfterSec) });
      return false;
    }
    set({ busy: true, error: null });
    const res = await friendService.sendRequest(uid, trimmed);
    if (res.ok) {
      recordRequest();
      set({ busy: false });
      return true;
    }
    set({ busy: false, error: res.error.message });
    return false;
  },

  acceptRequest: async (fromUid) => {
    const uid = currentUid();
    if (!uid) return false;
    set({ busy: true, error: null });
    const res = await friendService.acceptRequest(fromUid, uid);
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  declineRequest: async (fromUid) => {
    const uid = currentUid();
    if (!uid) return false;
    set({ busy: true, error: null });
    const res = await friendService.declineRequest(fromUid, uid);
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  cancelRequest: async (toUid) => {
    const uid = currentUid();
    if (!uid) return false;
    set({ busy: true, error: null });
    const res = await friendService.cancelRequest(uid, toUid);
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  removeFriend: async (friendUid) => {
    const uid = currentUid();
    if (!uid) return false;
    set({ busy: true, error: null });
    const res = await friendService.removeFriend(uid, friendUid);
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  blockUser: async (targetUid) => {
    const uid = currentUid();
    if (!uid) return false;
    set({ busy: true, error: null });
    const res = await friendService.blockUser(uid, targetUid);
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  unblockUser: async (targetUid) => {
    const uid = currentUid();
    if (!uid) return false;
    set({ busy: true, error: null });
    const res = await friendService.unblockUser(uid, targetUid);
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  setNickname: async (friendUid, nickname) => {
    const uid = currentUid();
    if (!uid) return false;
    set({ busy: true, error: null });
    const res = await friendService.updateFriendMeta(uid, friendUid, {
      nickname: nickname.trim() || undefined,
    });
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  setNote: async (friendUid, note) => {
    const uid = currentUid();
    if (!uid) return false;
    set({ busy: true, error: null });
    const res = await friendService.updateFriendMeta(uid, friendUid, {
      note: note.trim() || undefined,
    });
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  toggleFavorite: async (friendUid) => {
    const uid = currentUid();
    if (!uid) return false;
    const edge = get().friends.find((f) => f.userId === friendUid);
    const next = !edge?.favorite;
    set({ busy: true, error: null });
    const res = await friendService.updateFriendMeta(uid, friendUid, { favorite: next });
    set({ busy: false, ...(res.ok ? {} : { error: res.error.message }) });
    return res.ok;
  },

  clearError: () => set({ error: null }),

  _hydrateProfiles: async (uids) => {
    const have = get().profiles;
    const missing = Array.from(new Set(uids)).filter((id) => id && !have[id]);
    if (missing.length === 0) return;
    const res = await userService.getUsers(missing);
    if (!res.ok) {
      logger.error("friends: profile hydrate failed", res.error);
      return;
    }
    const next: Record<string, User> = { ...get().profiles };
    res.data.forEach((docData: UserDoc) => {
      next[docData.uid] = userDocToUser(docData);
    });
    set({ profiles: next });
  },
}));

// ---- Derived selector hooks ------------------------------------------------

/** A friend edge paired with the resolved profile of the other user. */
export interface FriendWithUser {
  edge: FriendDoc;
  user: User;
}

/** Apply an owner-set nickname over the display name, when present. */
export function friendDisplayName(fw: FriendWithUser): string {
  return fw.edge.nickname?.trim() || fw.user.displayName;
}

/**
 * Accepted friends paired with their profiles. Favorites first, then by
 * display name. Edges whose profile hasn't hydrated yet are held back.
 */
export function useFriends(): FriendWithUser[] {
  const friends = useFriendsStore((s) => s.friends);
  const profiles = useFriendsStore((s) => s.profiles);
  return friends
    .map((edge) => {
      const user = profiles[edge.userId];
      return user ? { edge, user } : null;
    })
    .filter((f): f is FriendWithUser => f !== null)
    .sort((a, b) => {
      if (a.edge.favorite !== b.edge.favorite) return a.edge.favorite ? -1 : 1;
      return friendDisplayName(a).localeCompare(friendDisplayName(b));
    });
}

/** Accepted friends who are not offline (reads the static `status` field). */
export function useOnlineFriends(): FriendWithUser[] {
  return useFriends().filter((f) => f.user.status !== "offline");
}

/** Incoming + outgoing pending requests, each paired with the other user. */
export interface PendingEntry {
  request: FriendRequestDoc;
  user: User;
  direction: "incoming" | "outgoing";
}

export function usePendingRequests(): PendingEntry[] {
  const incoming = useFriendsStore((s) => s.incoming);
  const outgoing = useFriendsStore((s) => s.outgoing);
  const profiles = useFriendsStore((s) => s.profiles);
  const entries: PendingEntry[] = [];
  incoming.forEach((request) => {
    const user = profiles[request.fromId];
    if (user) entries.push({ request, user, direction: "incoming" });
  });
  outgoing.forEach((request) => {
    const user = profiles[request.toId];
    if (user) entries.push({ request, user, direction: "outgoing" });
  });
  return entries;
}

/** Blocked users paired with their profiles. */
export interface BlockedEntry {
  block: BlockedUserDoc;
  user: User;
}

export function useBlockedUsers(): BlockedEntry[] {
  const blocked = useFriendsStore((s) => s.blocked);
  const profiles = useFriendsStore((s) => s.profiles);
  return blocked
    .map((block) => {
      const user = profiles[block.targetId];
      return user ? { block, user } : null;
    })
    .filter((b): b is BlockedEntry => b !== null);
}

/** Count of pending incoming requests — for sidebar/tab badges. */
export function usePendingIncomingCount(): number {
  return useFriendsStore((s) => s.incoming.length);
}
