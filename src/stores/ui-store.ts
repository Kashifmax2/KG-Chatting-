import { create } from "zustand";
import type { Message, User } from "@/types";

type ModalType =
  | "createServer"
  | "inviteFriends"
  | "settings"
  | "search"
  | null;

interface ImagePreviewState {
  url: string;
  name: string;
}

interface ProfilePopupState {
  user: User;
  anchor: { x: number; y: number };
}

interface UIState {
  // Global modals
  activeModal: ModalType;
  openModal: (modal: Exclude<ModalType, null>) => void;
  closeModal: () => void;

  // Mobile navigation drawer
  mobileSidebarOpen: boolean;
  setMobileSidebar: (open: boolean) => void;

  // Member list (right rail) visibility
  memberListOpen: boolean;
  toggleMemberList: () => void;

  // Reply composer target
  replyTarget: Message | null;
  setReplyTarget: (message: Message | null) => void;

  // Active thread panel
  activeThreadMessageId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;

  // Pinned messages panel
  pinnedPanelOpen: boolean;
  togglePinnedPanel: () => void;

  // Lightweight image lightbox
  imagePreview: ImagePreviewState | null;
  setImagePreview: (preview: ImagePreviewState | null) => void;

  // Hover/click profile popup
  profilePopup: ProfilePopupState | null;
  setProfilePopup: (popup: ProfilePopupState | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  mobileSidebarOpen: false,
  setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),

  memberListOpen: true,
  toggleMemberList: () => set((s) => ({ memberListOpen: !s.memberListOpen })),

  replyTarget: null,
  setReplyTarget: (message) => set({ replyTarget: message }),

  activeThreadMessageId: null,
  openThread: (messageId) => set({ activeThreadMessageId: messageId }),
  closeThread: () => set({ activeThreadMessageId: null }),

  pinnedPanelOpen: false,
  togglePinnedPanel: () => set((s) => ({ pinnedPanelOpen: !s.pinnedPanelOpen })),

  imagePreview: null,
  setImagePreview: (preview) => set({ imagePreview: preview }),

  profilePopup: null,
  setProfilePopup: (popup) => set({ profilePopup: popup }),
}));
