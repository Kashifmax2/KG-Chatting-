import { motion } from "framer-motion";
import { MessageCircle, MoreVertical, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { UserBadges } from "@/components/shared/user-badges";
import { statusMeta } from "@/components/shared/status-dot";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

/** A single action rendered in the card's overflow (three-dot) menu. */
export interface ProfileCardAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  destructive?: boolean;
}

interface ProfilePopupCardProps {
  user: User;
  onMessage?: () => void;
  /** Wires the quick "add friend" button; hidden when omitted. */
  onAddFriend?: () => void;
  /** Actions for the overflow menu; the three-dot button hides when empty. */
  actions?: ProfileCardAction[];
  className?: string;
  compact?: boolean;
}

/**
 * The rich profile card shown in the popover / profile page. Purely
 * presentational so it can be reused anywhere a user hovers or clicks.
 */
export function ProfilePopupCard({
  user,
  onMessage,
  onAddFriend,
  actions,
  className,
  compact,
}: ProfilePopupCardProps) {
  const hasMenu = Boolean(actions && actions.length > 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl",
        className
      )}
    >
      <div
        className="h-20 bg-cover bg-center"
        style={
          user.bannerUrl
            ? { backgroundImage: `url(${user.bannerUrl})` }
            : { backgroundColor: user.bannerColor }
        }
      />
      <div className="px-4 pb-4">
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <UserAvatar
            user={user}
            size="xl"
            showStatus
            ringClassName="border-popover"
            className="rounded-full ring-[6px] ring-popover"
          />
          {!compact && (onAddFriend || hasMenu) && (
            <div className="mb-1 flex gap-1">
              {onAddFriend && (
                <Button
                  size="icon-sm"
                  variant="subtle"
                  aria-label="Add friend"
                  onClick={onAddFriend}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
              {hasMenu && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="subtle" aria-label="More">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-[70] w-48">
                    {actions!.map((action, i) => {
                      const Icon = action.icon;
                      const prevDestructive =
                        i > 0 && !actions![i - 1].destructive && action.destructive;
                      return (
                        <div key={action.key}>
                          {prevDestructive && <DropdownMenuSeparator />}
                          <DropdownMenuItem
                            variant={action.destructive ? "destructive" : "default"}
                            onSelect={action.onSelect}
                          >
                            <Icon className="h-4 w-4" />
                            {action.label}
                          </DropdownMenuItem>
                        </div>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-background/60 p-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{user.displayName}</h3>
            <UserBadges badges={user.badges} />
          </div>
          {user.customStatus?.trim() && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {user.customStatus}
            </p>
          )}

          <Separator className="my-3" />

          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            About Me
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {user.bio ?? "This user prefers to keep an air of mystery."}
          </p>

          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  statusMeta[user.status].color
                )}
              />
              {statusMeta[user.status].label}
            </span>
            {user.pronouns && <span>{user.pronouns}</span>}
          </div>

          {onMessage && (
            <Button
              onClick={onMessage}
              className="mt-3 w-full"
              variant="secondary"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
