import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AtSign,
  Bell,
  Check,
  Mail,
  ServerCog,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useNotificationsStore } from "@/stores/notifications-store";
import { getUser } from "@/data/users";
import { HomeSidebar } from "@/components/layout/home-sidebar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, timeAgo } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";

const typeMeta: Record<
  NotificationType,
  { icon: typeof Bell; tint: string }
> = {
  mention: { icon: AtSign, tint: "text-brand" },
  friend_request: { icon: UserPlus, tint: "text-online" },
  server_invite: { icon: ServerCog, tint: "text-fuchsia-400" },
  message: { icon: Mail, tint: "text-sky-400" },
  system: { icon: Sparkles, tint: "text-amber-400" },
};

export default function NotificationsPage() {
  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;

  const open = (n: AppNotification) => {
    markRead(n.id);
    if (n.serverId && n.channelId)
      navigate(`/servers/${n.serverId}/${n.channelId}`);
    else if (n.type === "friend_request") navigate("/friends");
  };

  return (
    <div className="flex h-full min-w-0 flex-1">
      <HomeSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-chat">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-bold">Notifications</h1>
          {unread > 0 && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
              {unread} new
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={markAllRead}
            disabled={unread === 0}
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        </header>

        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-2xl p-4">
            {items.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="You're all caught up"
                description="New mentions and requests will appear here."
              />
            ) : (
              <div className="space-y-2">
                {items.map((n) => {
                  const meta = typeMeta[n.type];
                  const Icon = meta.icon;
                  const actor = n.actorId ? getUser(n.actorId) : undefined;
                  return (
                    <motion.button
                      key={n.id}
                      layout
                      onClick={() => open(n)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-brand/40 hover:bg-accent/40",
                        !n.read && "bg-brand/5"
                      )}
                    >
                      {actor ? (
                        <UserAvatar user={actor} size="md" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-elevated">
                          <Icon className={cn("h-5 w-5", meta.tint)} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4 shrink-0", meta.tint)} />
                          <p className="truncate font-semibold">{n.title}</p>
                          {!n.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {n.body}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(new Date(n.createdAt))}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
