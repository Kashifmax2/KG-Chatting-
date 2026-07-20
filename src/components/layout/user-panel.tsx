import { useState } from "react";
import { Headphones, Mic, MicOff, Settings, Volume2, VolumeX } from "lucide-react";
import { useCurrentUser } from "@/stores/auth-store";
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
  const user = useCurrentUser();
  const openModal = useUIStore((s) => s.openModal);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  // Rendered only inside the authenticated tree, so `user` is populated in
  // practice; guard anyway for the brief hydration window on hard refresh.
  if (!user) return null;

  const secondary = user.customStatus ?? user.username;

  return (
    <div className="flex items-center gap-0.5 bg-elevated/60 px-2 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => openModal("settings")}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-accent"
          >
            <UserAvatar
              user={user}
              size="sm"
              showStatus
              ringClassName="border-elevated"
            />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold">{user.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{secondary}</p>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{secondary}</TooltipContent>
      </Tooltip>

      <div className="flex shrink-0 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setMuted((m) => !m)}
              className={cn("h-8 w-8", muted && "text-destructive")}
              aria-label={muted ? "Unmute" : "Mute"}
              aria-pressed={muted}
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
              className={cn("h-8 w-8", deafened && "text-destructive")}
              aria-label={deafened ? "Undeafen" : "Deafen"}
              aria-pressed={deafened}
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
              className="h-8 w-8"
              aria-label="User Settings"
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
