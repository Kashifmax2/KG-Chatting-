import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import type { PresenceStatus, User } from "@/types";

const statusColor: Record<PresenceStatus, string> = {
  online: "bg-online",
  idle: "bg-idle",
  dnd: "bg-dnd",
  offline: "bg-offline",
};

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
} as const;

const indicatorSize = {
  sm: "h-3 w-3 border-2",
  md: "h-3.5 w-3.5 border-2",
  lg: "h-4 w-4 border-[3px]",
  xl: "h-6 w-6 border-4",
} as const;

interface UserAvatarProps {
  user: User;
  size?: keyof typeof sizeMap;
  showStatus?: boolean;
  className?: string;
  /** Ring color that matches the surface behind the status dot. */
  ringClassName?: string;
}

export function UserAvatar({
  user,
  size = "md",
  showStatus = false,
  className,
  ringClassName = "border-sidebar",
}: UserAvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <Avatar className={sizeMap[size]}>
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
        <AvatarFallback style={{ backgroundColor: user.bannerColor }}>
          {getInitials(user.displayName)}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full",
            statusColor[user.status],
            indicatorSize[size],
            ringClassName
          )}
          aria-label={user.status}
        />
      )}
    </div>
  );
}
