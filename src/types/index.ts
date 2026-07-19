/**
 * Domain types for KG Chatting.
 * These mirror the shape a real backend would return, so the UI can be wired
 * to a live API later with minimal churn.
 */

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";

export interface User {
  id: string;
  username: string;
  displayName: string;
  discriminator: string; // e.g. "0001"
  avatarUrl?: string;
  bannerColor: string;
  status: PresenceStatus;
  customStatus?: string;
  bio?: string;
  pronouns?: string;
  badges: UserBadge[];
  createdAt: string;
}

export type UserBadge =
  | "staff"
  | "partner"
  | "early_supporter"
  | "hypesquad"
  | "bug_hunter"
  | "verified_dev";

export interface Server {
  id: string;
  name: string;
  iconUrl?: string;
  bannerUrl?: string;
  description?: string;
  ownerId: string;
  memberCount: number;
  online: number;
  boostLevel: 0 | 1 | 2 | 3;
  categories: Category[];
  roles: Role[];
  memberIds: string[];
  tags: string[];
  verified?: boolean;
}

export interface Category {
  id: string;
  name: string;
  channels: Channel[];
}

export type ChannelType = "text" | "voice" | "announcement" | "forum";

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: ChannelType;
  topic?: string;
  unread?: boolean;
  mentionCount?: number;
  connectedUserIds?: string[]; // for voice channels
}

export interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  memberIds: string[];
  hoist: boolean; // display separately in member list
}

export interface Attachment {
  id: string;
  type: "image" | "video" | "file" | "gif" | "audio";
  url: string;
  name: string;
  size?: number;
  width?: number;
  height?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
  editedAt?: string;
  attachments: Attachment[];
  reactions: Reaction[];
  replyTo?: string; // message id
  pinned?: boolean;
  threadId?: string;
  mentions?: string[];
}

export interface Thread {
  id: string;
  parentMessageId: string;
  channelId: string;
  name: string;
  messageIds: string[];
  memberCount: number;
}

export interface DMChannel {
  id: string;
  participantIds: string[];
  isGroup: boolean;
  name?: string; // for group DMs
  lastMessageAt: string;
  unread?: boolean;
}

export type FriendStatus = "friend" | "pending_incoming" | "pending_outgoing" | "blocked";

export interface Friend {
  userId: string;
  status: FriendStatus;
  since: string;
}

export type NotificationType =
  | "mention"
  | "friend_request"
  | "server_invite"
  | "message"
  | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actorId?: string;
  serverId?: string;
  channelId?: string;
  createdAt: string;
  read: boolean;
}

export interface Emoji {
  id: string;
  char: string;
  name: string;
  category: string;
}

export interface GifItem {
  id: string;
  title: string;
  gradient: string; // stand-in for a real GIF preview
  width: number;
  height: number;
}
