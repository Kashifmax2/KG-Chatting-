import { NavLink } from "react-router-dom";
import { Bell, Plus, Users } from "lucide-react";
import { getDMMessages } from "@/data/dms";
import { CURRENT_USER_ID } from "@/data/users";
import { useDMStore } from "@/stores/dm-store";
import { useUnreadCount } from "@/stores/notifications-store";
import { UserPanel } from "@/components/layout/user-panel";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";
import type { DMChannel } from "@/types";

function DMRow({ dm }: { dm: DMChannel }) {
  const resolveUser = useDMStore((s) => s.resolveUser);
  const other = dm.participantIds.find((id) => id !== CURRENT_USER_ID);
  const user = resolveUser(other ?? "");
  const title = dm.isGroup ? dm.name ?? "Group DM" : user?.displayName ?? "Unknown";
  const messages = getDMMessages(dm.id);
  const last = messages[messages.length - 1];

  return (
    <NavLink
      to={`/dm/${dm.id}`}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors",
          isActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        )
      }
    >
      {dm.isGroup ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
          <Users className="h-4 w-4" />
        </div>
      ) : user ? (
        <UserAvatar user={user} size="sm" showStatus ringClassName="border-sidebar" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-sm font-semibold">{title}</span>
          {dm.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
        </div>
        {last && (
          <p className="truncate text-xs text-muted-foreground">
            {last.authorId === CURRENT_USER_ID ? "You: " : ""}
            {last.content || "Sent an attachment"}
          </p>
        )}
      </div>
      {last && (
        <span className="self-start text-[10px] text-muted-foreground">
          {timeAgo(new Date(last.createdAt))}
        </span>
      )}
    </NavLink>
  );
}

export function HomeSidebar() {
  const unreadCount = useUnreadCount();
  const channels = useDMStore((s) => s.channels);

  return (
    <div className="flex h-full w-60 flex-col bg-sidebar">
      <div className="border-b border-black/20 p-2.5 shadow-sm">
        <Input
          placeholder="Find or start a conversation"
          className="h-8 bg-rail text-sm"
        />
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        <NavLink
          to="/friends"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-2 py-2 font-semibold transition-colors",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )
          }
        >
          <Users className="h-5 w-5" />
          Friends
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-2 py-2 font-semibold transition-colors",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )
          }
        >
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </NavLink>

        <div className="mt-4 flex items-center justify-between px-2 pb-1">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Direct Messages
          </span>
          <Button size="icon-sm" variant="ghost" className="h-4 w-4">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-0.5">
          {channels.map((dm) => (
            <DMRow key={dm.id} dm={dm} />
          ))}
        </div>
      </ScrollArea>

      <UserPanel />
    </div>
  );
}
