import type { User } from "@/types";
import { freezeSeeds } from "./freeze";

/** The signed-in user. */
export const CURRENT_USER_ID = "u_kg";

export const users: User[] = [
  {
    id: "u_kg",
    username: "kgmax",
    displayName: "KG",
    discriminator: "0001",
    bannerColor: "hsl(235 86% 65%)",
    status: "online",
    customStatus: "building KG Chatting ✨",
    bio: "Founder & product tinkerer. I like clean UI and fast keyboards.",
    pronouns: "he/him",
    badges: ["staff", "early_supporter", "verified_dev"],
    createdAt: "2021-03-14T10:00:00.000Z",
  },
  {
    id: "u_aria",
    username: "aria",
    displayName: "Aria Chen",
    discriminator: "2048",
    bannerColor: "hsl(320 70% 60%)",
    status: "online",
    customStatus: "shipping pixels 🎨",
    bio: "Design systems, motion, and good coffee.",
    pronouns: "she/her",
    badges: ["partner", "hypesquad"],
    createdAt: "2021-06-01T10:00:00.000Z",
  },
  {
    id: "u_leo",
    username: "leon",
    displayName: "Leon",
    discriminator: "7777",
    bannerColor: "hsl(145 63% 42%)",
    status: "idle",
    customStatus: "afk — back soon",
    bio: "Backend gremlin. Databases are my love language.",
    pronouns: "he/him",
    badges: ["bug_hunter"],
    createdAt: "2020-11-20T10:00:00.000Z",
  },
  {
    id: "u_maya",
    username: "maya",
    displayName: "Maya",
    discriminator: "0420",
    bannerColor: "hsl(38 92% 55%)",
    status: "dnd",
    customStatus: "in the zone 🎧",
    bio: "ML researcher. Ask me about transformers.",
    pronouns: "she/her",
    badges: ["hypesquad", "early_supporter"],
    createdAt: "2022-01-05T10:00:00.000Z",
  },
  {
    id: "u_theo",
    username: "theo",
    displayName: "Theo",
    discriminator: "1337",
    bannerColor: "hsl(280 70% 60%)",
    status: "online",
    bio: "Frontend, DX, and terminal ricing.",
    pronouns: "they/them",
    badges: ["verified_dev"],
    createdAt: "2021-09-09T10:00:00.000Z",
  },
  {
    id: "u_nina",
    username: "nina",
    displayName: "Nina",
    discriminator: "3141",
    bannerColor: "hsl(190 80% 50%)",
    status: "offline",
    bio: "Community lead. Be kind, ship often.",
    pronouns: "she/her",
    badges: ["partner"],
    createdAt: "2020-05-18T10:00:00.000Z",
  },
  {
    id: "u_sam",
    username: "sam",
    displayName: "Sam",
    discriminator: "9021",
    bannerColor: "hsl(10 80% 60%)",
    status: "online",
    customStatus: "🎮 Playing something",
    bio: "Gamer. Speedrunner. Coffee-powered.",
    pronouns: "he/him",
    badges: [],
    createdAt: "2022-07-22T10:00:00.000Z",
  },
  {
    id: "u_ivy",
    username: "ivy",
    displayName: "Ivy",
    discriminator: "5555",
    bannerColor: "hsl(160 60% 45%)",
    status: "idle",
    bio: "Writer & docs wizard.",
    pronouns: "she/her",
    badges: ["hypesquad"],
    createdAt: "2021-12-01T10:00:00.000Z",
  },
  {
    id: "u_zane",
    username: "zane",
    displayName: "Zane",
    discriminator: "8080",
    bannerColor: "hsl(250 70% 60%)",
    status: "dnd",
    bio: "Security researcher. Trust nothing.",
    pronouns: "he/him",
    badges: ["bug_hunter", "staff"],
    createdAt: "2020-02-14T10:00:00.000Z",
  },
  {
    id: "u_bot",
    username: "kgbot",
    displayName: "KG Bot",
    discriminator: "0000",
    bannerColor: "hsl(235 86% 65%)",
    status: "online",
    customStatus: "at your service",
    bio: "The friendly automation bot for KG Chatting.",
    badges: ["verified_dev"],
    createdAt: "2021-03-14T10:00:00.000Z",
  },
];

freezeSeeds(users);

const userMap = new Map(users.map((u) => [u.id, u]));

export function getUser(id: string): User | undefined {
  return userMap.get(id);
}

export function getCurrentUser(): User {
  return userMap.get(CURRENT_USER_ID)!;
}
