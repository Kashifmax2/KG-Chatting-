import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Plus, Smile, Sticker, X } from "lucide-react";
import type { Attachment, GifItem } from "@/types";
import { useChatStore } from "@/stores/chat-store";
import { useUIStore } from "@/stores/ui-store";
import { getUser } from "@/data/users";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { GifPicker } from "@/components/chat/gif-picker";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatBytes } from "@/lib/utils";

interface ComposerProps {
  channelId: string;
  placeholder: string;
  /** Users typing, to render the indicator above the box. */
  typingUserIds?: string[];
}

let attachmentId = 0;

export function Composer({ channelId, placeholder, typingUserIds = [] }: ComposerProps) {
  const [value, setValue] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sendMessage = useChatStore((s) => s.sendMessage);
  const replyTarget = useUIStore((s) => s.replyTarget);
  const setReplyTarget = useUIStore((s) => s.setReplyTarget);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed && pendingAttachments.length === 0) return;
    sendMessage(channelId, trimmed, {
      attachments: pendingAttachments,
      replyTo: replyTarget?.id,
    });
    setValue("");
    setPendingAttachments([]);
    setReplyTarget(null);
    // Reset the textarea height.
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const insertEmoji = (emoji: string) => {
    setValue((v) => v + emoji);
    textareaRef.current?.focus();
  };

  const addGif = (gif: GifItem) => {
    sendMessage(channelId, "", {
      attachments: [
        {
          id: `gif_${attachmentId++}`,
          type: "gif",
          url: gif.gradient,
          name: gif.title,
        },
      ],
      replyTo: replyTarget?.id,
    });
    setReplyTarget(null);
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = Array.from(files).map((file) => ({
      id: `att_${attachmentId++}`,
      type: file.type.startsWith("image/") ? "image" : "file",
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "#",
      name: file.name,
      size: file.size,
    }));
    setPendingAttachments((prev) => [...prev, ...next]);
  };

  const typingNames = typingUserIds
    .map((id) => getUser(id)?.displayName)
    .filter(Boolean) as string[];

  return (
    <div className="px-4 pb-6 pt-0">
      {/* Reply banner */}
      <AnimatePresence>
        {replyTarget && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center justify-between rounded-t-lg bg-elevated px-4 py-1.5 text-sm"
          >
            <span className="text-muted-foreground">
              Replying to{" "}
              <span className="font-semibold text-foreground">
                {getUser(replyTarget.authorId)?.displayName}
              </span>
            </span>
            <button
              onClick={() => setReplyTarget(null)}
              className="rounded-full p-1 hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending attachments */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-t-lg bg-elevated/80 p-3">
          {pendingAttachments.map((att) => (
            <div
              key={att.id}
              className="relative overflow-hidden rounded-lg border border-border bg-chat p-2"
            >
              {att.type === "image" ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="h-24 w-24 rounded object-cover"
                />
              ) : (
                <div className="flex h-24 w-40 flex-col justify-end">
                  <p className="truncate text-xs font-semibold">{att.name}</p>
                  {att.size && (
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(att.size)}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={() =>
                  setPendingAttachments((prev) =>
                    prev.filter((a) => a.id !== att.id)
                  )
                }
                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow hover:bg-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex items-end gap-2 bg-elevated px-3 py-2",
          replyTarget || pendingAttachments.length > 0
            ? "rounded-b-lg"
            : "rounded-lg"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              className="mb-0.5 shrink-0 rounded-full"
              onClick={() => fileRef.current?.click()}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload a file</TooltipContent>
        </Tooltip>

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="flex-1"
        />

        <div className="mb-0.5 flex shrink-0 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon-sm" variant="ghost" className="rounded-full">
                <Gift className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <GifPicker onSelect={addGif} />
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-sm" variant="ghost" className="rounded-full">
                <Sticker className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stickers</TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-full text-amber-400 hover:text-amber-300"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <EmojiPicker onSelect={insertEmoji} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Typing indicator */}
      <div className="h-5 px-1 pt-1">
        <AnimatePresence>
          {typingNames.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ y: [0, -3, 0] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </span>
              <span className="font-semibold text-foreground">
                {typingNames.join(", ")}
              </span>
              {typingNames.length === 1 ? " is typing" : " are typing"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
