/**
 * Central registry of Cloud Firestore collection paths.
 *
 * Every service references collection names through this map so a rename or
 * restructure happens in one place and typos can't drift between services.
 * These are definitions only — no reads or writes happen here.
 */
export const COLLECTIONS = {
  users: "users",
  friends: "friends",
  friendRequests: "friend_requests",
  directMessages: "direct_messages",
  dmMessages: "dm_messages",
  servers: "servers",
  serverMembers: "server_members",
  channels: "channels",
  channelMessages: "channel_messages",
  notifications: "notifications",
  notificationPrefs: "notification_prefs",
  settings: "settings",
  presence: "presence",
  uploads: "uploads",
  searchIndex: "search_index",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Path builders for subcollections. Keeping these as functions documents the
 * intended document hierarchy without hardcoding string concatenation across
 * services.
 */
export const SUBCOLLECTIONS = {
  /** Messages belonging to a DM channel: direct_messages/{dmId}/dm_messages */
  dmMessages: (dmId: string) =>
    `${COLLECTIONS.directMessages}/${dmId}/${COLLECTIONS.dmMessages}`,
  /** Messages belonging to a channel: channels/{channelId}/channel_messages */
  channelMessages: (channelId: string) =>
    `${COLLECTIONS.channels}/${channelId}/${COLLECTIONS.channelMessages}`,
  /** Members of a server: servers/{serverId}/server_members */
  serverMembers: (serverId: string) =>
    `${COLLECTIONS.servers}/${serverId}/${COLLECTIONS.serverMembers}`,
} as const;
