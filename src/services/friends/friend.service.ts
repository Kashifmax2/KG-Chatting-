/**
 * FriendService — friendships and friend requests.
 *
 * Backed by the `friends` and `friend_requests` collections. Phase 03 defines
 * the contract only. Writes are transactional (accepting a request creates the
 * friendship on both sides) once implemented.
 */
import type { Result, Unsubscribe } from "@/types/service";
import type { FriendDoc, FriendRequestDoc } from "@/types/firestore";
import { notImplemented } from "@/services/service-utils";

export const friendService = {
  /** List the current user's friends. */
  listFriends(_uid: string): Promise<Result<FriendDoc[]>> {
    return notImplemented("friendService.listFriends");
  },

  /** Send a friend request to another user. */
  sendRequest(_fromUid: string, _toUsername: string): Promise<Result<void>> {
    return notImplemented("friendService.sendRequest");
  },

  /** Accept an incoming friend request. */
  acceptRequest(_requestId: string): Promise<Result<void>> {
    return notImplemented("friendService.acceptRequest");
  },

  /** Decline or cancel a friend request. */
  declineRequest(_requestId: string): Promise<Result<void>> {
    return notImplemented("friendService.declineRequest");
  },

  /** Remove an existing friend. */
  removeFriend(_uid: string, _friendUid: string): Promise<Result<void>> {
    return notImplemented("friendService.removeFriend");
  },

  /** Block a user. */
  blockUser(_uid: string, _targetUid: string): Promise<Result<void>> {
    return notImplemented("friendService.blockUser");
  },

  /** Subscribe to the current user's friend list. */
  subscribeToFriends(
    _uid: string,
    _cb: (friends: FriendDoc[]) => void
  ): Unsubscribe {
    return notImplemented("friendService.subscribeToFriends");
  },

  /** Subscribe to incoming/outgoing friend requests. */
  subscribeToRequests(
    _uid: string,
    _cb: (requests: FriendRequestDoc[]) => void
  ): Unsubscribe {
    return notImplemented("friendService.subscribeToRequests");
  },
} as const;
