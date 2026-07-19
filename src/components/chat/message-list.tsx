import { useEffect, useMemo, useRef } from "react";
import type { Message } from "@/types";
import { MessageItem } from "@/components/chat/message-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDayDivider } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  channelId: string;
  header?: React.ReactNode;
}

const GROUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

type Row =
  | { kind: "divider"; id: string; label: string }
  | { kind: "message"; message: Message; grouped: boolean };

export function MessageList({ messages, channelId, header }: MessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const byId = useMemo(
    () => new Map(messages.map((m) => [m.id, m])),
    [messages]
  );

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastDay = "";
    let prev: Message | null = null;

    for (const message of messages) {
      const date = new Date(message.createdAt);
      const dayKey = date.toDateString();
      if (dayKey !== lastDay) {
        out.push({
          kind: "divider",
          id: `divider-${dayKey}`,
          label: formatDayDivider(date),
        });
        lastDay = dayKey;
        prev = null;
      }

      const grouped =
        prev !== null &&
        prev.authorId === message.authorId &&
        !message.replyTo &&
        date.getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;

      out.push({ kind: "message", message, grouped });
      prev = message;
    }
    return out;
  }, [messages]);

  // Keep the view pinned to the newest message when the list grows.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <ScrollArea className="flex-1" viewportRef={viewportRef}>
      <div className="flex min-h-full flex-col justify-end py-4">
        {header}
        {rows.map((row) =>
          row.kind === "divider" ? (
            <div
              key={row.id}
              className="my-3 flex items-center gap-2 px-4"
              role="separator"
            >
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold text-muted-foreground">
                {row.label}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          ) : (
            <MessageItem
              key={row.message.id}
              message={row.message}
              grouped={row.grouped}
              channelId={channelId}
              replyToMessage={
                row.message.replyTo ? byId.get(row.message.replyTo) : undefined
              }
            />
          )
        )}
      </div>
    </ScrollArea>
  );
}
