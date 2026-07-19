import type { Emoji, GifItem } from "@/types";
import { freezeSeeds } from "./freeze";

export const emojiCategories = [
  "Smileys",
  "Gestures",
  "Animals",
  "Food",
  "Activities",
  "Objects",
  "Symbols",
] as const;

export const emojis: Emoji[] = [
  { id: "e1", char: "😀", name: "grinning", category: "Smileys" },
  { id: "e2", char: "😂", name: "joy", category: "Smileys" },
  { id: "e3", char: "🥰", name: "smiling_hearts", category: "Smileys" },
  { id: "e4", char: "😎", name: "cool", category: "Smileys" },
  { id: "e5", char: "🤔", name: "thinking", category: "Smileys" },
  { id: "e6", char: "😭", name: "sob", category: "Smileys" },
  { id: "e7", char: "🥳", name: "partying", category: "Smileys" },
  { id: "e8", char: "😴", name: "sleeping", category: "Smileys" },
  { id: "e9", char: "👍", name: "thumbsup", category: "Gestures" },
  { id: "e10", char: "👎", name: "thumbsdown", category: "Gestures" },
  { id: "e11", char: "👏", name: "clap", category: "Gestures" },
  { id: "e12", char: "🙏", name: "pray", category: "Gestures" },
  { id: "e13", char: "🫡", name: "salute", category: "Gestures" },
  { id: "e14", char: "🤝", name: "handshake", category: "Gestures" },
  { id: "e15", char: "✌️", name: "victory", category: "Gestures" },
  { id: "e16", char: "🐶", name: "dog", category: "Animals" },
  { id: "e17", char: "🐱", name: "cat", category: "Animals" },
  { id: "e18", char: "🦊", name: "fox", category: "Animals" },
  { id: "e19", char: "🐼", name: "panda", category: "Animals" },
  { id: "e20", char: "🦄", name: "unicorn", category: "Animals" },
  { id: "e21", char: "🍕", name: "pizza", category: "Food" },
  { id: "e22", char: "🍔", name: "burger", category: "Food" },
  { id: "e23", char: "🍣", name: "sushi", category: "Food" },
  { id: "e24", char: "☕", name: "coffee", category: "Food" },
  { id: "e25", char: "🍩", name: "donut", category: "Food" },
  { id: "e26", char: "⚽", name: "soccer", category: "Activities" },
  { id: "e27", char: "🎮", name: "gaming", category: "Activities" },
  { id: "e28", char: "🎨", name: "art", category: "Activities" },
  { id: "e29", char: "🎧", name: "headphones", category: "Activities" },
  { id: "e30", char: "🎉", name: "party", category: "Activities" },
  { id: "e31", char: "💻", name: "laptop", category: "Objects" },
  { id: "e32", char: "📱", name: "phone", category: "Objects" },
  { id: "e33", char: "💡", name: "bulb", category: "Objects" },
  { id: "e34", char: "🔥", name: "fire", category: "Objects" },
  { id: "e35", char: "🚀", name: "rocket", category: "Objects" },
  { id: "e36", char: "❤️", name: "heart", category: "Symbols" },
  { id: "e37", char: "💯", name: "hundred", category: "Symbols" },
  { id: "e38", char: "✅", name: "check", category: "Symbols" },
  { id: "e39", char: "⭐", name: "star", category: "Symbols" },
  { id: "e40", char: "💫", name: "dizzy", category: "Symbols" },
];

/** Frequently used, shown as a quick row. */
export const frequentEmojis = ["😂", "🔥", "❤️", "🎉", "🚀", "💯", "👍", "🫡"];

/**
 * Stand-in "GIFs" — since there's no backend, each is a labeled animated
 * gradient tile that behaves like a real GIF result grid.
 */
export const trendingGifs: GifItem[] = [
  { id: "g1", title: "Happy Dance", gradient: "linear-gradient(135deg,#f97316,#ec4899)", width: 220, height: 160 },
  { id: "g2", title: "Mind Blown", gradient: "linear-gradient(135deg,#8b5cf6,#3b82f6)", width: 220, height: 200 },
  { id: "g3", title: "Applause", gradient: "linear-gradient(135deg,#10b981,#84cc16)", width: 220, height: 150 },
  { id: "g4", title: "Facepalm", gradient: "linear-gradient(135deg,#ef4444,#f59e0b)", width: 220, height: 180 },
  { id: "g5", title: "Celebration", gradient: "linear-gradient(135deg,#ec4899,#8b5cf6)", width: 220, height: 220 },
  { id: "g6", title: "Thumbs Up", gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)", width: 220, height: 140 },
  { id: "g7", title: "Wave Hello", gradient: "linear-gradient(135deg,#14b8a6,#22c55e)", width: 220, height: 170 },
  { id: "g8", title: "Shocked", gradient: "linear-gradient(135deg,#a855f7,#ec4899)", width: 220, height: 190 },
];

freezeSeeds(emojiCategories, emojis, frequentEmojis, trendingGifs);
