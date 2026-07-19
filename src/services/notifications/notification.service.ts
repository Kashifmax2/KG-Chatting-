/**
 * NotificationService — user notifications.
 *
 * Backed by the `notifications` collection. Phase 03 defines the contract only.
 * Notifications are per-user; rules restrict reads/writes to the owner.
 */
import type { Result, Unsubscribe } from "@/types/service";
import type { NotificationDoc } from "@/types/firestore";
import { notImplemented } from "@/services/service-utils";

export const notificationService = {
  /** List a user's notifications, newest first. */
  list(_uid: string): Promise<Result<NotificationDoc[]>> {
    return notImplemented("notificationService.list");
  },

  /** Mark a single notification as read. */
  markRead(_uid: string, _notificationId: string): Promise<Result<void>> {
    return notImplemented("notificationService.markRead");
  },

  /** Mark all of a user's notifications as read. */
  markAllRead(_uid: string): Promise<Result<void>> {
    return notImplemented("notificationService.markAllRead");
  },

  /** Delete a notification. */
  remove(_uid: string, _notificationId: string): Promise<Result<void>> {
    return notImplemented("notificationService.remove");
  },

  /** Subscribe to live notifications for a user. */
  subscribe(
    _uid: string,
    _cb: (notifications: NotificationDoc[]) => void
  ): Unsubscribe {
    return notImplemented("notificationService.subscribe");
  },
} as const;
