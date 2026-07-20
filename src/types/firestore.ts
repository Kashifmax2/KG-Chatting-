/**
 * Firestore document models.
 *
 * These describe the server-side shape of stored documents and are kept
 * deliberately separate from the UI-facing types in `@/types` (which use
 * plain strings for dates and omit storage bookkeeping). A mapping layer in the
 * services will translate between the two once business logic lands — this
 * phase only defines the architecture.
 *
 * `Timestamp` is Firestore's own time type; `serverTimestamp()` writes it.
 */
import type { Timestamp } from "firebase/firestore";
import type {
  ChannelType,
  NotificationType,
  PresenceStatus,
  PrivacyLevel,
  ProfilePrivacy,
  SocialLink,
  UserBadge,
} from "@/types";

/** Fields every top-level document carries for auditing/ordering. */
export interface BaseDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserDoc extends BaseDoc {
  uid: string;
  username: string;
  usernameLower: string; // for case-insensitive lookups / uniqueness
  displayName: string;
  discriminator: string;
  email: string;
  emailVerified: boolean;
  avatarUrl?: string;
  /** Cloudinary public id of the current avatar, kept so it can be replaced/removed. */
  avatarPublicId?: string;
  /** Uploaded banner image (Cloudinary); the UI falls back to `bannerColor` when unset. */
  bannerUrl?: string;
  /** Cloudinary public id of the current banner image. */
  bannerPublicId?: string;
  bannerColor: string;
  /** Cosmetic accent colour for the profile (CSS colour string). */
  accentColor?: string;
  status: PresenceStatus; // last-known presence, mirrored from RTDB
  customStatus?: string;
  bio?: string;
  pronouns?: string;
  country?: string;
  language?: string;
  website?: string;
  socialLinks?: SocialLink[];
  badges: UserBadge[];
  /** Profile privacy controls. Seeded permissively at signup. */
  privacy: ProfilePrivacy;
  /** When the username was last changed; gates change frequency (Phase 05). */
  usernameLastChangedAt?: Timestamp;
  /** Last time the user was seen online; seeded at signup (Phase 05/07 read this). */
  lastSeen: Timestamp;
}

/**
 * One directed edge of a friendship (Phase 06, dual-doc mirror). A friendship
 * between A and B is stored as two docs — `{A}_{B}` owned by A and `{B}_{A}`
 * owned by B — so every list query is a simple `where ownerId == uid`. Edges
 * exist only for accepted friendships; pending/declined/cancelled live in
 * `friend_requests`. Per-owner metadata (nickname/note/favorite) lives on the
 * owner's own edge, so each side customises independently.
 */
export interface FriendDoc extends BaseDoc {
  /** Owner of this friend edge (the query key). */
  ownerId: string;
  /** The other user in the relationship. */
  userId: string;
  /** Always "accepted" — an edge is only written once a request is accepted. */
  status: "accepted";
  /** When the friendship was established (mirrors on both edges). */
  since: Timestamp;
  /** Owner-private nickname for the friend. */
  nickname?: string;
  /** Owner-private free-form note about the friend. */
  note?: string;
  /** Owner-private "favorite" flag for pinning/sorting. */
  favorite: boolean;
}

/** Lifecycle states a friend request moves through. */
export type FriendRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled";

export interface FriendRequestDoc extends BaseDoc {
  fromId: string;
  toId: string;
  status: FriendRequestStatus;
}

/**
 * A block edge (Phase 06). Owner-private; blocking removes any friendship and
 * cancels pending requests, and prevents new requests in either direction.
 */
export interface BlockedUserDoc extends BaseDoc {
  /** The user who created the block (query key). */
  ownerId: string;
  /** The user who is blocked. */
  targetId: string;
}

/**
 * Per-user friend settings (Phase 06). Owner-private. `allowRequestsFrom`
 * mirrors the profile `privacy.friendRequests` control so request-sending can
 * be gated without reading the whole user doc.
 */
export interface FriendSettingsDoc extends BaseDoc {
  ownerId: string;
  allowRequestsFrom: PrivacyLevel;
}

export interface DirectMessageDoc extends BaseDoc {
  participantIds: string[];
  isGroup: boolean;
  name?: string;
  ownerId?: string; // group DM owner
  lastMessageAt: Timestamp;
  lastMessagePreview?: string;
}

export interface MessageDoc extends BaseDoc {
  authorId: string;
  content: string;
  editedAt?: Timestamp;
  attachmentIds: string[];
  replyTo?: string;
  pinned: boolean;
  mentions: string[];
}

export interface ServerDoc extends BaseDoc {
  name: string;
  iconUrl?: string;
  bannerUrl?: string;
  description?: string;
  ownerId: string;
  memberCount: number;
  boostLevel: 0 | 1 | 2 | 3;
  tags: string[];
  verified: boolean;
}

export interface ServerMemberDoc extends BaseDoc {
  serverId: string;
  userId: string;
  roleIds: string[];
  nickname?: string;
}

export interface ChannelDoc extends BaseDoc {
  serverId: string;
  categoryId?: string;
  name: string;
  type: ChannelType;
  topic?: string;
  position: number;
}

export interface NotificationDoc extends BaseDoc {
  ownerId: string;
  type: NotificationType;
  title: string;
  body: string;
  actorId?: string;
  serverId?: string;
  channelId?: string;
  read: boolean;
}

export interface SettingsDoc extends BaseDoc {
  ownerId: string;
  theme: "light" | "dark" | "system";
  locale: string;
  notificationsEnabled: boolean;
}

/**
 * Per-user notification preferences. Seeded at signup with permissive defaults;
 * the Notification phase (Phase 13) extends this with per-server/channel rules.
 */
export interface NotificationPrefsDoc extends BaseDoc {
  ownerId: string;
  desktop: boolean;
  push: boolean;
  email: boolean;
  sounds: boolean;
  /** Mute everything (do-not-disturb) regardless of the flags above. */
  muteAll: boolean;
}

/** Ephemeral presence record — mirrored to RTDB, optionally snapshotted here. */
export interface PresenceDoc {
  uid: string;
  status: PresenceStatus;
  lastSeen: Timestamp;
}

export interface UploadDoc extends BaseDoc {
  ownerId: string;
  kind: "image" | "video" | "file" | "audio" | "avatar" | "banner";
  provider: "cloudinary" | "firebase-storage";
  url: string;
  name: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface SearchIndexDoc {
  refId: string;
  kind: "user" | "server" | "channel" | "message";
  text: string; // lowercased searchable text
  ownerScope?: string; // e.g. serverId, to scope search results
}
