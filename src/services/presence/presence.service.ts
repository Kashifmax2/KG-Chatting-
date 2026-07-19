/**
 * PresenceService — realtime online/offline + typing state.
 *
 * Uses Realtime Database (not Firestore) because presence is ephemeral and
 * benefits from RTDB's onDisconnect hooks. Phase 03 defines the contract only.
 * Never stores permanent data here.
 */
import type { PresenceStatus } from "@/types";
import type { Result, Unsubscribe } from "@/types/service";
import { notImplemented } from "@/services/service-utils";

export const presenceService = {
  /** Begin tracking the current user's presence, wiring onDisconnect cleanup. */
  initPresence(_uid: string): Promise<Result<void>> {
    return notImplemented("presenceService.initPresence");
  },

  /** Update the current user's presence status. */
  setStatus(_uid: string, _status: PresenceStatus): Promise<Result<void>> {
    return notImplemented("presenceService.setStatus");
  },

  /** Subscribe to a user's presence status. */
  subscribeToPresence(
    _uid: string,
    _cb: (status: PresenceStatus) => void
  ): Unsubscribe {
    return notImplemented("presenceService.subscribeToPresence");
  },

  /** Set typing state for the current user in a channel/DM. */
  setTyping(
    _channelId: string,
    _uid: string,
    _isTyping: boolean
  ): Promise<Result<void>> {
    return notImplemented("presenceService.setTyping");
  },

  /** Subscribe to the set of users currently typing in a channel/DM. */
  subscribeToTyping(
    _channelId: string,
    _cb: (typingUids: string[]) => void
  ): Unsubscribe {
    return notImplemented("presenceService.subscribeToTyping");
  },
} as const;
