import { create } from "zustand";
import type { Message } from "@/types";
import { getMessages } from "@/data/messages";
import { getDMMessages } from "@/data/dms";
import { CURRENT_USER_ID } from "@/data/users";

interface ChatState {
  /** Messages per channel, hydrated lazily from mock data on first access. */
  messages: Record<string, Message[]>;
  /** Which channels have been hydrated. */
  hydrated: Set<string>;
  /** Users currently "typing" per channel (mocked). */
  typing: Record<string, string[]>;

  ensureChannel: (channelId: string, isDM?: boolean) => void;
  sendMessage: (
    channelId: string,
    content: string,
    extras?: Partial<Pick<Message, "attachments" | "replyTo">>
  ) => void;
  editMessage: (channelId: string, messageId: string, content: string) => void;
  deleteMessage: (channelId: string, messageId: string) => void;
  toggleReaction: (channelId: string, messageId: string, emoji: string) => void;
  togglePin: (channelId: string, messageId: string) => void;
  setTyping: (channelId: string, userIds: string[]) => void;
}

let idCounter = 0;
const nextId = () => `local_${Date.now()}_${idCounter++}`;

/** Stable empty array so selectors don't return a fresh `[]` each render. */
export const EMPTY_TYPING: string[] = [];

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  hydrated: new Set(),
  typing: {},

  ensureChannel: (channelId, isDM = false) => {
    if (get().hydrated.has(channelId)) return;
    const seed = isDM ? getDMMessages(channelId) : getMessages(channelId);
    set((state) => {
      const hydrated = new Set(state.hydrated);
      hydrated.add(channelId);
      return {
        hydrated,
        messages: { ...state.messages, [channelId]: [...seed] },
      };
    });
  },

  sendMessage: (channelId, content, extras) => {
    const message: Message = {
      id: nextId(),
      channelId,
      authorId: CURRENT_USER_ID,
      content,
      createdAt: new Date().toISOString(),
      attachments: extras?.attachments ?? [],
      reactions: [],
      replyTo: extras?.replyTo,
    };
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] ?? []), message],
      },
    }));
  },

  editMessage: (channelId, messageId, content) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] ?? []).map((m) =>
          m.id === messageId
            ? { ...m, content, editedAt: new Date().toISOString() }
            : m
        ),
      },
    }));
  },

  deleteMessage: (channelId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] ?? []).filter(
          (m) => m.id !== messageId
        ),
      },
    }));
  },

  toggleReaction: (channelId, messageId, emoji) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] ?? []).map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions.find((r) => r.emoji === emoji);
          let reactions;
          if (existing) {
            const count = existing.count + (existing.reactedByMe ? -1 : 1);
            reactions =
              count <= 0
                ? m.reactions.filter((r) => r.emoji !== emoji)
                : m.reactions.map((r) =>
                    r.emoji === emoji
                      ? { ...r, count, reactedByMe: !r.reactedByMe }
                      : r
                  );
          } else {
            reactions = [...m.reactions, { emoji, count: 1, reactedByMe: true }];
          }
          return { ...m, reactions };
        }),
      },
    }));
  },

  togglePin: (channelId, messageId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: (state.messages[channelId] ?? []).map((m) =>
          m.id === messageId ? { ...m, pinned: !m.pinned } : m
        ),
      },
    }));
  },

  setTyping: (channelId, userIds) => {
    set((state) => ({ typing: { ...state.typing, [channelId]: userIds } }));
  },
}));
