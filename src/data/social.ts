import type { AppNotification, Friend } from "@/types";
import { freezeSeeds } from "./freeze";

const now = Date.now();
const min = 60_000;
const hr = 60 * min;
const day = 24 * hr;

export const friends: Friend[] = [
  { userId: "u_aria", status: "friend", since: "2021-07-01T10:00:00.000Z" },
  { userId: "u_leo", status: "friend", since: "2021-01-11T10:00:00.000Z" },
  { userId: "u_maya", status: "friend", since: "2022-02-02T10:00:00.000Z" },
  { userId: "u_theo", status: "friend", since: "2021-10-10T10:00:00.000Z" },
  { userId: "u_sam", status: "friend", since: "2022-08-08T10:00:00.000Z" },
  { userId: "u_ivy", status: "pending_incoming", since: "2026-07-18T10:00:00.000Z" },
  { userId: "u_zane", status: "pending_outgoing", since: "2026-07-17T10:00:00.000Z" },
  { userId: "u_nina", status: "friend", since: "2020-06-06T10:00:00.000Z" },
];

export const notifications: AppNotification[] = [
  {
    id: "n1",
    type: "mention",
    title: "Theo mentioned you",
    body: "@KG can you review my PR when you get a sec? 🙏",
    actorId: "u_theo",
    serverId: "s_dev",
    channelId: "ch_dev_general",
    createdAt: new Date(now - 12 * min).toISOString(),
    read: false,
  },
  {
    id: "n2",
    type: "friend_request",
    title: "New friend request",
    body: "Ivy wants to be your friend.",
    actorId: "u_ivy",
    createdAt: new Date(now - 3 * hr).toISOString(),
    read: false,
  },
  {
    id: "n3",
    type: "server_invite",
    title: "Server invite",
    body: "Sam invited you to Game Night.",
    actorId: "u_sam",
    serverId: "s_game",
    createdAt: new Date(now - 6 * hr).toISOString(),
    read: true,
  },
  {
    id: "n4",
    type: "message",
    title: "Aria sent you a message",
    body: "Perfect. I'll prep the export for tomorrow's review 🙌",
    actorId: "u_aria",
    createdAt: new Date(now - 8 * min).toISOString(),
    read: false,
  },
  {
    id: "n5",
    type: "system",
    title: "Welcome to KG Chatting",
    body: "Your account is all set up. Explore servers to get started!",
    createdAt: new Date(now - 2 * day).toISOString(),
    read: true,
  },
];

freezeSeeds(friends, notifications);
