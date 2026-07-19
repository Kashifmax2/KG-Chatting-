import type { Server } from "@/types";
import { freezeSeeds } from "./freeze";

const allMembers = [
  "u_kg",
  "u_aria",
  "u_leo",
  "u_maya",
  "u_theo",
  "u_nina",
  "u_sam",
  "u_ivy",
  "u_zane",
  "u_bot",
];

export const servers: Server[] = [
  {
    id: "s_design",
    name: "Design Guild",
    description: "A home for product designers, motion nerds, and UI craftspeople.",
    ownerId: "u_aria",
    memberCount: 12840,
    online: 2310,
    boostLevel: 3,
    verified: true,
    tags: ["Design", "Creative", "Community"],
    memberIds: allMembers,
    roles: [
      { id: "r_admin", name: "Admin", color: "hsl(359 66% 55%)", position: 3, hoist: true, memberIds: ["u_aria"] },
      { id: "r_mod", name: "Moderator", color: "hsl(145 63% 42%)", position: 2, hoist: true, memberIds: ["u_theo", "u_ivy"] },
      { id: "r_member", name: "Member", color: "hsl(235 86% 65%)", position: 1, hoist: false, memberIds: allMembers },
    ],
    categories: [
      {
        id: "c_info",
        name: "Information",
        channels: [
          { id: "ch_welcome", serverId: "s_design", name: "welcome", type: "text", topic: "Say hi and read the rules 👋" },
          { id: "ch_announce", serverId: "s_design", name: "announcements", type: "announcement", topic: "Official updates", mentionCount: 2 },
        ],
      },
      {
        id: "c_general",
        name: "General",
        channels: [
          { id: "ch_general", serverId: "s_design", name: "general", type: "text", topic: "General chit-chat about anything design.", unread: true },
          { id: "ch_feedback", serverId: "s_design", name: "portfolio-feedback", type: "text", topic: "Share your work for critique." },
          { id: "ch_resources", serverId: "s_design", name: "resources", type: "text", topic: "Fonts, plugins, references." },
          { id: "ch_forum", serverId: "s_design", name: "showcase", type: "forum", topic: "Threaded project showcases." },
        ],
      },
      {
        id: "c_voice",
        name: "Voice Lounges",
        channels: [
          { id: "ch_vc_studio", serverId: "s_design", name: "Studio", type: "voice", connectedUserIds: ["u_aria", "u_theo"] },
          { id: "ch_vc_coffee", serverId: "s_design", name: "Coffee Break", type: "voice", connectedUserIds: [] },
        ],
      },
    ],
  },
  {
    id: "s_dev",
    name: "Dev Lounge",
    description: "Engineers helping engineers. Frontend, backend, infra, everything.",
    ownerId: "u_kg",
    memberCount: 45210,
    online: 8120,
    boostLevel: 2,
    verified: true,
    tags: ["Programming", "Tech", "Open Source"],
    memberIds: allMembers,
    roles: [
      { id: "r2_admin", name: "Core", color: "hsl(280 70% 60%)", position: 3, hoist: true, memberIds: ["u_kg", "u_zane"] },
      { id: "r2_help", name: "Helper", color: "hsl(190 80% 50%)", position: 2, hoist: true, memberIds: ["u_leo", "u_maya"] },
      { id: "r2_member", name: "Dev", color: "hsl(145 63% 49%)", position: 1, hoist: false, memberIds: allMembers },
    ],
    categories: [
      {
        id: "c2_start",
        name: "Start Here",
        channels: [
          { id: "ch_rules", serverId: "s_dev", name: "rules", type: "text", topic: "Be excellent to each other." },
          { id: "ch_intros", serverId: "s_dev", name: "introductions", type: "text", topic: "Tell us what you build." },
        ],
      },
      {
        id: "c2_talk",
        name: "Text Channels",
        channels: [
          { id: "ch_dev_general", serverId: "s_dev", name: "general", type: "text", topic: "Talk shop.", unread: true, mentionCount: 5 },
          { id: "ch_frontend", serverId: "s_dev", name: "frontend", type: "text", topic: "React, CSS, and the DOM." },
          { id: "ch_backend", serverId: "s_dev", name: "backend", type: "text", topic: "APIs, databases, queues." },
          { id: "ch_help", serverId: "s_dev", name: "help", type: "text", topic: "Ask your questions here." },
        ],
      },
      {
        id: "c2_voice",
        name: "Voice",
        channels: [
          { id: "ch_vc_pair", serverId: "s_dev", name: "Pair Programming", type: "voice", connectedUserIds: ["u_kg", "u_leo", "u_maya"] },
          { id: "ch_vc_afk", serverId: "s_dev", name: "AFK", type: "voice", connectedUserIds: [] },
        ],
      },
    ],
  },
  {
    id: "s_game",
    name: "Game Night",
    description: "Squad up. Voice chat, tournaments, and late-night runs.",
    ownerId: "u_sam",
    memberCount: 8930,
    online: 1440,
    boostLevel: 1,
    tags: ["Gaming", "Esports", "Community"],
    memberIds: ["u_kg", "u_sam", "u_theo", "u_nina", "u_ivy"],
    roles: [
      { id: "r3_admin", name: "Host", color: "hsl(10 80% 60%)", position: 2, hoist: true, memberIds: ["u_sam"] },
      { id: "r3_member", name: "Player", color: "hsl(38 92% 55%)", position: 1, hoist: false, memberIds: ["u_kg", "u_theo", "u_nina", "u_ivy"] },
    ],
    categories: [
      {
        id: "c3_main",
        name: "Lobby",
        channels: [
          { id: "ch_game_general", serverId: "s_game", name: "general", type: "text", topic: "GGs and memes." },
          { id: "ch_lfg", serverId: "s_game", name: "looking-for-group", type: "text", topic: "Find your squad." },
          { id: "ch_clips", serverId: "s_game", name: "clips", type: "text", topic: "Post your best plays." },
        ],
      },
      {
        id: "c3_voice",
        name: "Voice Rooms",
        channels: [
          { id: "ch_vc_squad1", serverId: "s_game", name: "Squad One", type: "voice", connectedUserIds: ["u_sam", "u_theo"] },
          { id: "ch_vc_squad2", serverId: "s_game", name: "Squad Two", type: "voice", connectedUserIds: [] },
        ],
      },
    ],
  },
];

freezeSeeds(servers);

const serverMap = new Map(servers.map((s) => [s.id, s]));

export function getServer(id: string): Server | undefined {
  return serverMap.get(id);
}

export function getChannel(channelId: string) {
  for (const server of servers) {
    for (const category of server.categories) {
      const channel = category.channels.find((c) => c.id === channelId);
      if (channel) return { channel, server, category };
    }
  }
  return undefined;
}

export function getFirstTextChannel(serverId: string) {
  const server = serverMap.get(serverId);
  if (!server) return undefined;
  for (const category of server.categories) {
    const text = category.channels.find((c) => c.type === "text" || c.type === "announcement");
    if (text) return text;
  }
  return undefined;
}
