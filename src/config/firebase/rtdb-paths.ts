/**
 * Realtime Database path builders.
 *
 * RTDB is used ONLY for ephemeral realtime state — presence, typing indicators,
 * voice session state, and temporary session data. Permanent chat history lives
 * in Firestore, never here.
 */
export const RTDB_PATHS = {
  /** Root presence node; per-user status under presence/{uid}. */
  presence: (uid: string) => `presence/${uid}`,

  /** Typing indicator for a channel/DM: typing/{channelId}/{uid}. */
  typing: (channelId: string, uid: string) => `typing/${channelId}/${uid}`,

  /** All typers in a channel/DM (for listeners): typing/{channelId}. */
  typingChannel: (channelId: string) => `typing/${channelId}`,

  /** Voice state for a user in a voice channel: voiceStates/{channelId}/{uid}. */
  voiceState: (channelId: string, uid: string) =>
    `voiceStates/${channelId}/${uid}`,

  /** All voice participants in a channel: voiceStates/{channelId}. */
  voiceChannel: (channelId: string) => `voiceStates/${channelId}`,

  /** Temporary per-connection session data: sessions/{uid}/{sessionId}. */
  session: (uid: string, sessionId: string) => `sessions/${uid}/${sessionId}`,
} as const;
