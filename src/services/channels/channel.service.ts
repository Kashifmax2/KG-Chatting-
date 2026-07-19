/**
 * ChannelService — server channels and their messages.
 *
 * Backed by `channels` and the `channel_messages` subcollection. Phase 03
 * defines the contract only. Permission to post is enforced by security rules
 * based on server membership and role.
 */
import type { Result, Unsubscribe } from "@/types/service";
import type { ChannelDoc, MessageDoc } from "@/types/firestore";
import { notImplemented } from "@/services/service-utils";
import type { MessagePage, SendMessageInput } from "@/services/dm/dm.service";

export interface CreateChannelInput {
  serverId: string;
  name: string;
  type: ChannelDoc["type"];
  categoryId?: string;
  topic?: string;
}

export const channelService = {
  /** List channels within a server. */
  listChannels(_serverId: string): Promise<Result<ChannelDoc[]>> {
    return notImplemented("channelService.listChannels");
  },

  /** Create a channel in a server. */
  createChannel(_input: CreateChannelInput): Promise<Result<ChannelDoc>> {
    return notImplemented("channelService.createChannel");
  },

  /** Update mutable channel fields (name, topic). */
  updateChannel(_channelId: string, _patch: Partial<ChannelDoc>): Promise<Result<void>> {
    return notImplemented("channelService.updateChannel");
  },

  /** Delete a channel. */
  deleteChannel(_channelId: string): Promise<Result<void>> {
    return notImplemented("channelService.deleteChannel");
  },

  /** Fetch a page of messages for a channel. */
  fetchMessages(
    _channelId: string,
    _cursor?: string
  ): Promise<Result<MessagePage>> {
    return notImplemented("channelService.fetchMessages");
  },

  /** Send a message to a channel. */
  sendMessage(_input: SendMessageInput): Promise<Result<MessageDoc>> {
    return notImplemented("channelService.sendMessage");
  },

  /** Subscribe to live messages in a channel. */
  subscribeToMessages(
    _channelId: string,
    _cb: (messages: MessageDoc[]) => void
  ): Unsubscribe {
    return notImplemented("channelService.subscribeToMessages");
  },
} as const;
