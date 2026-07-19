import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/types";

const statusMeta: Record<PresenceStatus, { color: string; label: string }> = {
  online: { color: "bg-online", label: "Online" },
  idle: { color: "bg-idle", label: "Idle" },
  dnd: { color: "bg-dnd", label: "Do Not Disturb" },
  offline: { color: "bg-offline", label: "Offline" },
};

interface StatusDotProps {
  status: PresenceStatus;
  className?: string;
  withLabel?: boolean;
}

export function StatusDot({ status, className, withLabel }: StatusDotProps) {
  const meta = statusMeta[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", meta.color, className)} />
      {withLabel && (
        <span className="text-sm text-muted-foreground">{meta.label}</span>
      )}
    </span>
  );
}

export { statusMeta };
