import { useState } from "react";
import { Headphones, Mic, MicOff, Settings, Volume2, VolumeX } from "lucide-react";
import { getCurrentUser } from "@/data/users";
import { useUIStore } from "@/stores/ui-store";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** The persistent account controls pinned to the bottom of the channel sidebar. */
export function UserPanel() {
  const user = getCurrentUser();
  const openModal = useUIStore((s) => s.openModal);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  return (
    <div className="flex items-center gap-1 bg-elevated/60 px-2 py-2">
      <button
        onClick={() => openModal("settings")}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-accent"
      >
        <UserAvatar user={user} size="sm" showStatus ringClassName="border-elevated" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">{user.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user.customStatus ?? `${user.username}#${user.discriminator}`}
          </p>
        </div>
      </button>

      <div className="flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setMuted((m) => !m)}
              className={cn(muted && "text-destructive")}
            >
              {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{muted ? "Unmute" : "Mute"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setDeafened((d) => !d)}
              className={cn(deafened && "text-destructive")}
            >
              {deafened ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Headphones className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{deafened ? "Undeafen" : "Deafen"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => openModal("settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>User Settings</TooltipContent>
        </Tooltip>
      </div>
      {/* Volume icon kept for parity with the real client's control cluster */}
      <span className="sr-only">
        <Volume2 />
      </span>
    </div>
  );
}
