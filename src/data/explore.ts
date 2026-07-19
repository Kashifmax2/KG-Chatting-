import { freezeSeeds } from "./freeze";

export interface ExploreServer {
  id: string;
  name: string;
  description: string;
  banner: string; // gradient
  icon: string; // emoji stand-in
  members: number;
  online: number;
  category: string;
  featured?: boolean;
}

export const exploreCategories = [
  "Featured",
  "Gaming",
  "Music",
  "Education",
  "Science & Tech",
  "Entertainment",
  "Art",
] as const;

export const exploreServers: ExploreServer[] = [
  {
    id: "ex1",
    name: "Pixel Perfect",
    description: "The largest community for UI/UX designers and illustrators.",
    banner: "linear-gradient(135deg,#5865f2,#a855f7)",
    icon: "🎨",
    members: 128400,
    online: 24100,
    category: "Art",
    featured: true,
  },
  {
    id: "ex2",
    name: "Code & Coffee",
    description: "Developers from around the world sharing knowledge daily.",
    banner: "linear-gradient(135deg,#0ea5e9,#22c55e)",
    icon: "💻",
    members: 452100,
    online: 81200,
    category: "Science & Tech",
    featured: true,
  },
  {
    id: "ex3",
    name: "Midnight Gamers",
    description: "Late night squads, tournaments, and endless GGs.",
    banner: "linear-gradient(135deg,#ef4444,#f59e0b)",
    icon: "🎮",
    members: 89300,
    online: 14400,
    category: "Gaming",
    featured: true,
  },
  {
    id: "ex4",
    name: "Lo-Fi Lounge",
    description: "Chill beats, focus rooms, and a cozy community.",
    banner: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    icon: "🎧",
    members: 61200,
    online: 9800,
    category: "Music",
  },
  {
    id: "ex5",
    name: "Study Together",
    description: "Pomodoro rooms, accountability, and study buddies.",
    banner: "linear-gradient(135deg,#14b8a6,#22c55e)",
    icon: "📚",
    members: 34900,
    online: 5600,
    category: "Education",
  },
  {
    id: "ex6",
    name: "Sci-Fi & Fantasy",
    description: "Discuss the latest books, shows, and movies.",
    banner: "linear-gradient(135deg,#6366f1,#0ea5e9)",
    icon: "🚀",
    members: 77800,
    online: 11200,
    category: "Entertainment",
  },
  {
    id: "ex7",
    name: "AI Builders",
    description: "Ship AI products, share research, and trade prompts.",
    banner: "linear-gradient(135deg,#f43f5e,#8b5cf6)",
    icon: "🤖",
    members: 210500,
    online: 38700,
    category: "Science & Tech",
  },
  {
    id: "ex8",
    name: "Indie Music Makers",
    description: "Producers and songwriters collaborating in real time.",
    banner: "linear-gradient(135deg,#f59e0b,#ec4899)",
    icon: "🎹",
    members: 45300,
    online: 7100,
    category: "Music",
  },
  {
    id: "ex9",
    name: "Speedrun Central",
    description: "World records, routes, and glitch hunting.",
    banner: "linear-gradient(135deg,#22c55e,#0ea5e9)",
    icon: "🏁",
    members: 52700,
    online: 8900,
    category: "Gaming",
  },
];

freezeSeeds(exploreCategories, exploreServers);
