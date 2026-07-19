import { motion } from "framer-motion";
import { MessageCircle, MoreVertical, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { UserBadges } from "@/components/shared/user-badges";
import { statusMeta } from "@/components/shared/status-dot";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface ProfilePopupCardProps {
  user: User;
  onMessage?: () => void;
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
  className,
  compact,
}: ProfilePopupCardProps) {
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
          {!compact && (
            <div className="mb-1 flex gap-1">
              <Button size="icon-sm" variant="subtle" aria-label="Add friend">
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button size="icon-sm" variant="subtle" aria-label="More">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-background/60 p-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{user.displayName}</h3>
            <UserBadges badges={user.badges} />
          </div>
          <p className="text-sm text-muted-foreground">
            {user.username}#{user.discriminator}
          </p>

          {user.customStatus && (
            <p className="mt-2 text-sm">{user.customStatus}</p>
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
