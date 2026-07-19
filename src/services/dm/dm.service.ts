/**
 * DMService — direct-message channels and their messages.
 *
 * Backed by `direct_messages` and the `dm_messages` subcollection. Phase 03
 * defines the contract only. Message history lives in Firestore; typing state
 * lives in RTDB via PresenceService.
 */
import type { Result, Unsubscribe } from "@/types/service";
import type { DirectMessageDoc, MessageDoc } from "@/types/firestore";
import { notImplemented } from "@/services/service-utils";

export interface SendMessageInput {
  channelId: string;
  authorId: string;
  content: string;
  attachmentIds?: string[];
  replyTo?: string;
}

export interface MessagePage {
  messages: MessageDoc[];
  /** Opaque cursor for the next page, or null when exhausted. */
  cursor: string | null;
}

export const dmService = {
  /** List the current user's DM channels. */
  listChannels(_uid: string): Promise<Result<DirectMessageDoc[]>> {
    return notImplemented("dmService.listChannels");
  },

  /** Get or create a 1:1 DM channel with another user. */
  openDirectChannel(_uid: string, _otherUid: string): Promise<Result<DirectMessageDoc>> {
    return notImplemented("dmService.openDirectChannel");
  },

  /** Create a group DM channel. */
  createGroupChannel(
    _uid: string,
    _participantIds: string[],
    _name?: string
  ): Promise<Result<DirectMessageDoc>> {
    return notImplemented("dmService.createGroupChannel");
  },

  /** Fetch a page of messages for a DM channel. */
  fetchMessages(
    _channelId: string,
    _cursor?: string
  ): Promise<Result<MessagePage>> {
    return notImplemented("dmService.fetchMessages");
  },

  /** Send a message to a DM channel. */
  sendMessage(_input: SendMessageInput): Promise<Result<MessageDoc>> {
    return notImplemented("dmService.sendMessage");
  },

  /** Edit an existing message. */
  editMessage(
    _channelId: string,
    _messageId: string,
    _content: string
  ): Promise<Result<void>> {
    return notImplemented("dmService.editMessage");
  },

  /** Delete a message. */
  deleteMessage(_channelId: string, _messageId: string): Promise<Result<void>> {
    return notImplemented("dmService.deleteMessage");
  },

  /** Subscribe to live messages in a DM channel. */
  subscribeToMessages(
    _channelId: string,
    _cb: (messages: MessageDoc[]) => void
  ): Unsubscribe {
    return notImplemented("dmService.subscribeToMessages");
  },
} as const;
