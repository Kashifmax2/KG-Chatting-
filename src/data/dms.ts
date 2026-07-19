import type { DMChannel, Message } from "@/types";
import { freezeSeeds } from "./freeze";

const now = Date.now();
const min = 60_000;
const hr = 60 * min;
const day = 24 * hr;

export const dmChannels: DMChannel[] = [
  {
    id: "dmc_aria",
    participantIds: ["u_kg", "u_aria"],
    isGroup: false,
    lastMessageAt: new Date(now - 8 * min).toISOString(),
    unread: true,
  },
  {
    id: "dmc_leo",
    participantIds: ["u_kg", "u_leo"],
    isGroup: false,
    lastMessageAt: new Date(now - 2 * hr).toISOString(),
  },
  {
    id: "dmc_maya",
    participantIds: ["u_kg", "u_maya"],
    isGroup: false,
    lastMessageAt: new Date(now - 1 * day).toISOString(),
  },
  {
    id: "dmc_group",
    participantIds: ["u_kg", "u_theo", "u_ivy", "u_sam"],
    isGroup: true,
    name: "Launch Squad",
    lastMessageAt: new Date(now - 40 * min).toISOString(),
    unread: true,
  },
];

export const dmMessages: Record<string, Message[]> = {
  dmc_aria: [
    {
      id: "da1",
      channelId: "dmc_aria",
      authorId: "u_aria",
      content: "Hey! Did you get a chance to look at the new icon set?",
      createdAt: new Date(now - 3 * hr).toISOString(),
      attachments: [],
      reactions: [],
    },
    {
      id: "da2",
      channelId: "dmc_aria",
      authorId: "u_kg",
      content: "Yes! They're gorgeous. The rounded corners match our radius tokens perfectly.",
      createdAt: new Date(now - 3 * hr + 6 * min).toISOString(),
      attachments: [],
      reactions: [{ emoji: "❤️", count: 1, reactedByMe: false }],
    },
    {
      id: "da3",
      channelId: "dmc_aria",
      authorId: "u_aria",
      content: "Perfect. I'll prep the export for tomorrow's review 🙌",
      createdAt: new Date(now - 8 * min).toISOString(),
      attachments: [],
      reactions: [],
    },
  ],
  dmc_leo: [
    {
      id: "dl1",
      channelId: "dmc_leo",
      authorId: "u_leo",
      content: "migration's done, zero downtime 🎉",
      createdAt: new Date(now - 2 * hr).toISOString(),
      attachments: [],
      reactions: [{ emoji: "🚀", count: 1, reactedByMe: true }],
    },
  ],
  dmc_maya: [
    {
      id: "dmy1",
      channelId: "dmc_maya",
      authorId: "u_maya",
      content: "sending over the paper draft, lmk what you think",
      createdAt: new Date(now - 1 * day).toISOString(),
      attachments: [
        { id: "att_pdf", type: "file", url: "#", name: "attention-is-all-you-need-v2.pdf", size: 2_400_000 },
      ],
      reactions: [],
    },
  ],
  dmc_group: [
    {
      id: "dg1",
      channelId: "dmc_group",
      authorId: "u_theo",
      content: "Launch checklist is green across the board ✅",
      createdAt: new Date(now - 50 * min).toISOString(),
      attachments: [],
      reactions: [{ emoji: "🎉", count: 3, reactedByMe: true }],
    },
    {
      id: "dg2",
      channelId: "dmc_group",
      authorId: "u_ivy",
      content: "Docs are live and the changelog is queued.",
      createdAt: new Date(now - 45 * min).toISOString(),
      attachments: [],
      reactions: [],
    },
    {
      id: "dg3",
      channelId: "dmc_group",
      authorId: "u_sam",
      content: "let's gooo 🚀🚀",
      createdAt: new Date(now - 40 * min).toISOString(),
      attachments: [],
      reactions: [],
    },
  ],
};

freezeSeeds(dmChannels, dmMessages);

const dmMap = new Map(dmChannels.map((d) => [d.id, d]));

export function getDMChannel(id: string): DMChannel | undefined {
  return dmMap.get(id);
}

export function getDMMessages(id: string): Message[] {
  return dmMessages[id] ?? [];
}
