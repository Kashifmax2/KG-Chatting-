import type { Message } from "@/types";
import { freezeSeeds } from "./freeze";

const now = Date.now();
const min = 60_000;
const hr = 60 * min;

/** Messages keyed by channelId. */
export const messagesByChannel: Record<string, Message[]> = {
  ch_general: [
    {
      id: "m1",
      channelId: "ch_general",
      authorId: "u_aria",
      content: "Morning everyone ☀️ Just pushed the new motion tokens to the design system.",
      createdAt: new Date(now - 5 * hr).toISOString(),
      attachments: [],
      reactions: [
        { emoji: "🔥", count: 4, reactedByMe: true },
        { emoji: "🎉", count: 2, reactedByMe: false },
      ],
      pinned: true,
    },
    {
      id: "m2",
      channelId: "ch_general",
      authorId: "u_theo",
      content: "Ooo the spring curves feel so much smoother now. Nice work.",
      createdAt: new Date(now - 5 * hr + 3 * min).toISOString(),
      attachments: [],
      reactions: [],
    },
    {
      id: "m3",
      channelId: "ch_general",
      authorId: "u_theo",
      content: "Also — should we standardize on 200ms for micro-interactions?",
      createdAt: new Date(now - 5 * hr + 4 * min).toISOString(),
      attachments: [],
      reactions: [{ emoji: "💯", count: 3, reactedByMe: false }],
    },
    {
      id: "m4",
      channelId: "ch_general",
      authorId: "u_kg",
      content: "200ms for enter, 150ms for exit. Asymmetry reads as more responsive.",
      createdAt: new Date(now - 4 * hr).toISOString(),
      attachments: [],
      reactions: [
        { emoji: "🧠", count: 5, reactedByMe: false },
        { emoji: "👍", count: 2, reactedByMe: true },
      ],
      replyTo: "m3",
    },
    {
      id: "m5",
      channelId: "ch_general",
      authorId: "u_maya",
      content: "Dropping the moodboard for the new landing page. Thoughts welcome!",
      createdAt: new Date(now - 3 * hr).toISOString(),
      attachments: [
        {
          id: "a1",
          type: "image",
          url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=70",
          name: "moodboard.png",
          size: 1_240_000,
          width: 800,
          height: 520,
        },
      ],
      reactions: [
        { emoji: "😍", count: 6, reactedByMe: true },
        { emoji: "🎨", count: 3, reactedByMe: false },
      ],
    },
    {
      id: "m6",
      channelId: "ch_general",
      authorId: "u_ivy",
      content: "The gradient direction is chef's kiss. Maybe soften the shadow on the cards?",
      createdAt: new Date(now - 2 * hr - 40 * min).toISOString(),
      attachments: [],
      reactions: [],
      replyTo: "m5",
      threadId: "t1",
    },
    {
      id: "m7",
      channelId: "ch_general",
      authorId: "u_sam",
      content: "gm design legends 🫡",
      createdAt: new Date(now - 90 * min).toISOString(),
      attachments: [],
      reactions: [{ emoji: "🫡", count: 4, reactedByMe: false }],
    },
    {
      id: "m8",
      channelId: "ch_general",
      authorId: "u_bot",
      content: "Reminder: Design critique session starts in 30 minutes in the Studio voice channel.",
      createdAt: new Date(now - 30 * min).toISOString(),
      attachments: [],
      reactions: [{ emoji: "⏰", count: 2, reactedByMe: false }],
    },
    {
      id: "m9",
      channelId: "ch_general",
      authorId: "u_aria",
      content: "See everyone there 🎙️",
      createdAt: new Date(now - 8 * min).toISOString(),
      attachments: [],
      reactions: [],
    },
  ],
  ch_dev_general: [
    {
      id: "dm1",
      channelId: "ch_dev_general",
      authorId: "u_leo",
      content: "Anyone deployed on the new edge runtime yet? Curious about cold starts.",
      createdAt: new Date(now - 6 * hr).toISOString(),
      attachments: [],
      reactions: [],
    },
    {
      id: "dm2",
      channelId: "ch_dev_general",
      authorId: "u_kg",
      content: "Yep. Cold starts are ~40ms now. Night and day vs containers.",
      createdAt: new Date(now - 6 * hr + 5 * min).toISOString(),
      attachments: [],
      reactions: [{ emoji: "🚀", count: 8, reactedByMe: true }],
    },
    {
      id: "dm3",
      channelId: "ch_dev_general",
      authorId: "u_maya",
      content: "```ts\nexport const config = { runtime: 'edge' };\n```\nThat's literally all it took.",
      createdAt: new Date(now - 5 * hr).toISOString(),
      attachments: [],
      reactions: [{ emoji: "🤯", count: 5, reactedByMe: false }],
    },
    {
      id: "dm4",
      channelId: "ch_dev_general",
      authorId: "u_zane",
      content: "Just remember edge functions can't hold long-lived TCP connections. Bit me last week.",
      createdAt: new Date(now - 2 * hr).toISOString(),
      attachments: [],
      reactions: [{ emoji: "📌", count: 3, reactedByMe: false }],
      pinned: true,
    },
    {
      id: "dm5",
      channelId: "ch_dev_general",
      authorId: "u_theo",
      content: "@KG can you review my PR when you get a sec? 🙏",
      createdAt: new Date(now - 12 * min).toISOString(),
      attachments: [],
      reactions: [],
      mentions: ["u_kg"],
    },
  ],
  ch_welcome: [
    {
      id: "w1",
      channelId: "ch_welcome",
      authorId: "u_bot",
      content: "Welcome to **Design Guild**! 🎉 Grab a role in #roles and introduce yourself.",
      createdAt: new Date(now - 20 * hr).toISOString(),
      attachments: [],
      reactions: [{ emoji: "👋", count: 12, reactedByMe: true }],
      pinned: true,
    },
  ],
};

/** Fallback for channels without seeded messages. */
freezeSeeds(messagesByChannel);

export function getMessages(channelId: string): Message[] {
  return messagesByChannel[channelId] ?? [];
}
