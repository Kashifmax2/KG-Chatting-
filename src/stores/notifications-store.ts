import { create } from "zustand";
import { notifications as seed } from "@/data/social";
import type { AppNotification } from "@/types";

interface NotificationsState {
  items: AppNotification[];
  /** Count of unread notifications, derived on read via `useUnreadCount`. */
  markRead: (id: string) => void;
  markAllRead: () => void;
}

/**
 * Global notifications store. Read-state lives here (not in component state)
 * so marking a notification read survives navigation and stays in sync with
 * the sidebar badge. Seeded once from mock data.
 */
export const useNotificationsStore = create<NotificationsState>((set) => ({
  // Clone the seed so we never mutate the shared mock array.
  items: seed.map((n) => ({ ...n })),

  markRead: (id) =>
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => (n.read ? n : { ...n, read: true })),
    })),
}));

/** Selector hook: number of unread notifications. */
export const useUnreadCount = () =>
  useNotificationsStore((s) => s.items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0));
