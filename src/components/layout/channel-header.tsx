import { Bell, Hash, Inbox, Pin, Search, Users, Volume2 } from "lucide-react";
import type { Channel } from "@/types";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChannelHeaderProps {
  channel: Channel;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const toggleMemberList = useUIStore((s) => s.toggleMemberList);
  const memberListOpen = useUIStore((s) => s.memberListOpen);
  const togglePinned = useUIStore((s) => s.togglePinnedPanel);
  const openModal = useUIStore((s) => s.openModal);
  const Icon = channel.type === "voice" ? Volume2 : Hash;

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h1 className="truncate font-bold">{channel.name}</h1>
      </div>

      {channel.topic && (
        <>
          <div className="hidden h-6 w-px bg-border md:block" />
          <p className="hidden truncate text-sm text-muted-foreground md:block">
            {channel.topic}
          </p>
        </>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={togglePinned}>
              <Pin className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Pinned Messages</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={toggleMemberList}
              className={cn(memberListOpen && "text-foreground")}
            >
              <Users className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Member List</TooltipContent>
        </Tooltip>

        <div className="relative hidden sm:block">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            onFocus={() => openModal("search")}
            placeholder="Search"
            className="h-7 w-36 bg-rail pl-7 text-sm focus:w-52"
          />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost">
              <Inbox className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Inbox</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost">
              <Bell className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notification Settings</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
