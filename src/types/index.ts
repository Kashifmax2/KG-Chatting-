/**
 * Domain types for KG Chatting.
 * These mirror the shape a real backend would return, so the UI can be wired
 * to a live API later with minimal churn.
 */

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";

/** Who a given profile facet is visible to (Phase 05 — Profile Privacy). */
export type PrivacyLevel = "everyone" | "friends" | "nobody";

/** Profile privacy controls (Phase 05 — Profile Privacy). */
export interface ProfilePrivacy {
  /** Who can view the full profile. */
  profileVisibility: PrivacyLevel;
  /** Who can see the user's presence status. */
  statusVisibility: PrivacyLevel;
  /** Who can see the user's activity. */
  activityVisibility: PrivacyLevel;
  /** Who may send this user a friend request. */
  friendRequests: PrivacyLevel;
}

/** A single external/social link shown on a profile. */
export interface SocialLink {
  /** User-facing label, e.g. "GitHub" or "Portfolio". */
  label: string;
  /** Fully-qualified URL. */
  url: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  discriminator: string; // e.g. "0001"
  avatarUrl?: string;
  /** Uploaded banner image (Cloudinary); falls back to `bannerColor` when unset. */
  bannerUrl?: string;
  bannerColor: string;
  /** Cosmetic accent colour for the profile (CSS colour string). */
  accentColor?: string;
  status: PresenceStatus;
  customStatus?: string;
  bio?: string;
  pronouns?: string;
  country?: string;
  language?: string;
  website?: string;
  socialLinks?: SocialLink[];
  badges: UserBadge[];
  /** Populated for the live signed-in user; may be absent for seed/other users. */
  privacy?: ProfilePrivacy;
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
