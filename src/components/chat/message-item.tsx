import { useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Edit3,
  MoreHorizontal,
  Pin,
  Reply,
  SmilePlus,
  Trash2,
} from "lucide-react";
import type { Message } from "@/types";
import { getUser, CURRENT_USER_ID } from "@/data/users";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { MessageContent } from "@/components/chat/message-content";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatMessageTime } from "@/lib/utils";
import { AttachmentView } from "@/components/chat/attachment-view";
import { EditComposer } from "@/components/chat/edit-composer";
import { frequentEmojis } from "@/data/pickers";

interface MessageItemProps {
  message: Message;
  /** When true, this is a follow-up message (same author, close in time). */
  grouped: boolean;
  channelId: string;
  replyToMessage?: Message;
}

export function MessageItem({
  message,
  grouped,
  channelId,
  replyToMessage,
}: MessageItemProps) {
  const author = getUser(message.authorId);
  const isMine = message.authorId === CURRENT_USER_ID;
  const [editing, setEditing] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const togglePin = useChatStore((s) => s.togglePin);
  const setReplyTarget = useUIStore((s) => s.setReplyTarget);
  const setProfilePopup = useUIStore((s) => s.setProfilePopup);
  const openThread = useUIStore((s) => s.openThread);

  if (!author) return null;

  const openProfile = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProfilePopup({ user: author, anchor: { x: rect.right + 12, y: rect.top } });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "group relative flex gap-4 px-4 py-0.5 hover:bg-black/10",
            grouped ? "mt-0" : "mt-3",
            message.pinned && "bg-amber-500/5"
          )}
        >
          {/* Reply preview */}
          {replyToMessage && (
            <div className="absolute -top-1 left-16 flex items-center gap-1 text-xs text-muted-foreground">
              <div className="h-2 w-4 rounded-tl-md border-l-2 border-t-2 border-border" />
              <UserAvatar
                user={getUser(replyToMessage.authorId)!}
                size="sm"
                className="h-4 w-4"
              />
              <span className="font-semibold text-foreground/80">
                {getUser(replyToMessage.authorId)?.displayName}
              </span>
              <span className="max-w-md truncate opacity-80">
                {replyToMessage.content}
              </span>
            </div>
          )}

          {/* Gutter: avatar or hover timestamp */}
          <div className="w-10 shrink-0">
            {!grouped ? (
              <button onClick={openProfile}>
                <UserAvatar
                  user={author}
                  size="md"
                  className="mt-0.5 transition-transform hover:scale-105"
                />
              </button>
            ) : (
              <span className="mt-1 hidden select-none text-[10px] leading-6 text-muted-foreground group-hover:block">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="min-w-0 flex-1">
            {!grouped && (
              <div className="flex items-baseline gap-2">
                <button
                  onClick={openProfile}
                  className="font-semibold hover:underline"
                  style={{ color: author.bannerColor }}
                >
                  {author.displayName}
                </button>
                <span className="text-xs text-muted-foreground">
                  {formatMessageTime(new Date(message.createdAt))}
                </span>
                {message.pinned && (
                  <Pin className="h-3 w-3 text-amber-400" />
                )}
              </div>
            )}

            {editing ? (
              <EditComposer
                initialValue={message.content}
                onCancel={() => setEditing(false)}
                onSave={() => setEditing(false)}
                messageId={message.id}
                channelId={channelId}
              />
            ) : (
              <MessageContent content={message.content} />
            )}

            {message.editedAt && !editing && (
              <span className="ml-1 text-[10px] text-muted-foreground">(edited)</span>
            )}

            {/* Attachments */}
            {message.attachments.length > 0 && (
              <div className="mt-1 flex flex-col gap-2">
                {message.attachments.map((att) => (
                  <AttachmentView key={att.id} attachment={att} />
                ))}
              </div>
            )}

            {/* Reactions */}
            {message.reactions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {message.reactions.map((r) => (
                  <button
                    key={r.emoji}
                    onClick={() => toggleReaction(channelId, message.id, r.emoji)}
                    className={cn(
                      "flex items-center gap-1 rounded-md border px-2 py-0.5 text-sm transition-colors",
                      r.reactedByMe
                        ? "border-brand/60 bg-brand/20"
                        : "border-transparent bg-black/20 hover:border-border"
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span className="text-xs font-semibold tabular-nums">
                      {r.count}
                    </span>
                  </button>
                ))}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center rounded-md bg-black/20 px-2 py-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
                      <SmilePlus className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <EmojiPicker
                      onSelect={(emoji) =>
                        toggleReaction(channelId, message.id, emoji)
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Thread affordance */}
            {message.threadId && (
              <button
                onClick={() => openThread(message.id)}
                className="mt-1.5 flex items-center gap-2 rounded-md bg-black/20 px-2 py-1 text-xs font-semibold text-brand hover:bg-black/30"
              >
                <Reply className="h-3.5 w-3.5" />
                View thread
              </button>
            )}
          </div>

          {/* Hover toolbar */}
          <div className="absolute -top-3 right-4 hidden items-center gap-0.5 rounded-md border border-border bg-popover p-0.5 shadow-lg group-hover:flex">
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="h-7 w-7">
                  <SmilePlus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <EmojiPicker
                  onSelect={(emoji) => {
                    toggleReaction(channelId, message.id, emoji);
                    setEmojiOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setReplyTarget(message)}
                >
                  <Reply className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>

            {isMine && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setEditing(true)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            )}

            <Button size="icon-sm" variant="ghost" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => setReplyTarget(message)}>
          <Reply className="h-4 w-4" />
          Reply
        </ContextMenuItem>
        <div className="flex gap-1 px-2 py-1.5">
          {frequentEmojis.slice(0, 6).map((emoji) => (
            <button
              key={emoji}
              onClick={() => toggleReaction(channelId, message.id, emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </div>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => navigator.clipboard?.writeText(message.content)}
        >
          <Copy className="h-4 w-4" />
          Copy Text
        </ContextMenuItem>
        <ContextMenuItem onClick={() => togglePin(channelId, message.id)}>
          <Pin className="h-4 w-4" />
          {message.pinned ? "Unpin Message" : "Pin Message"}
        </ContextMenuItem>
        {isMine && (
          <>
            <ContextMenuItem onClick={() => setEditing(true)}>
              <Edit3 className="h-4 w-4" />
              Edit Message
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => deleteMessage(channelId, message.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Message
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
