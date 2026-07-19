import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Hash,
  Megaphone,
  MessagesSquare,
  Plus,
  Settings,
  UserPlus,
  Volume2,
} from "lucide-react";
import type { Channel, Server } from "@/types";
import { getUser } from "@/data/users";
import { useUIStore } from "@/stores/ui-store";
import { UserPanel } from "@/components/layout/user-panel";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const channelIcon = {
  text: Hash,
  announcement: Megaphone,
  forum: MessagesSquare,
  voice: Volume2,
} as const;

function ChannelRow({ channel }: { channel: Channel }) {
  const Icon = channelIcon[channel.type];
  const navigate = useNavigate();

  if (channel.type === "voice") {
    const connected = channel.connectedUserIds ?? [];
    return (
      <div>
        <button
          onClick={() => navigate(`/servers/${channel.serverId}/${channel.id}`)}
          className="group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm font-medium">{channel.name}</span>
        </button>
        {connected.length > 0 && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
            {connected.map((uid) => {
              const u = getUser(uid);
              if (!u) return null;
              return (
                <div key={uid} className="flex items-center gap-2 py-0.5">
                  <UserAvatar user={u} size="sm" className="h-6 w-6" />
                  <span className="truncate text-xs text-muted-foreground">
                    {u.displayName}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={`/servers/${channel.serverId}/${channel.id}`}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
          isActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          channel.unread && !isActive && "text-foreground"
        )
      }
    >
      {channel.unread && (
        <span className="absolute -ml-2 h-2 w-1 rounded-r-full bg-foreground" />
      )}
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate text-sm font-medium">{channel.name}</span>
      {channel.mentionCount ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
          {channel.mentionCount}
        </span>
      ) : null}
    </NavLink>
  );
}

function Category({
  name,
  channels,
}: {
  name: string;
  channels: Channel[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-1 px-1 pt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            !open && "-rotate-90"
          )}
        />
        <span className="truncate">{name}</span>
        <Plus className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 space-y-0.5">
              {channels.map((channel) => (
                <ChannelRow key={channel.id} channel={channel} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ChannelSidebar({ server }: { server: Server }) {
  const openModal = useUIStore((s) => s.openModal);

  return (
    <div className="flex h-full w-60 flex-col bg-sidebar">
      {/* Server header */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-12 items-center justify-between border-b border-black/20 px-4 shadow-sm transition-colors hover:bg-accent/40">
            <span className="truncate font-bold">{server.name}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuItem onClick={() => openModal("inviteFriends")}>
            <UserPlus className="h-4 w-4 text-brand" />
            Invite People
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal("settings")}>
            <Settings className="h-4 w-4" />
            Server Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openModal("createServer")}>
            <Plus className="h-4 w-4" />
            Create Channel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Channels */}
      <ScrollArea className="flex-1 px-2">
        <div className="pb-3">
          {server.categories.map((category) => (
            <Category
              key={category.id}
              name={category.name}
              channels={category.channels}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Invite affordance */}
      <div className="px-2 pb-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => openModal("inviteFriends")}
            >
              <UserPlus className="h-4 w-4" />
              Invite friends
            </Button>
          </TooltipTrigger>
          <TooltipContent>Invite friends to {server.name}</TooltipContent>
        </Tooltip>
      </div>

      <UserPanel />
    </div>
  );
}
