import {
  Bug,
  Code2,
  Crown,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { UserBadge } from "@/types";

const badgeMeta: Record<
  UserBadge,
  { label: string; icon: typeof Crown; className: string }
> = {
  staff: { label: "KG Staff", icon: ShieldCheck, className: "text-brand" },
  partner: { label: "Partner", icon: Crown, className: "text-fuchsia-400" },
  early_supporter: {
    label: "Early Supporter",
    icon: Sparkles,
    className: "text-amber-400",
  },
  hypesquad: { label: "HypeSquad", icon: Rocket, className: "text-purple-400" },
  bug_hunter: { label: "Bug Hunter", icon: Bug, className: "text-emerald-400" },
  verified_dev: {
    label: "Verified Developer",
    icon: Code2,
    className: "text-sky-400",
  },
};

interface UserBadgesProps {
  badges: UserBadge[];
  className?: string;
}

export function UserBadges({ badges, className }: UserBadgesProps) {
  if (!badges.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {badges.map((badge) => {
        const meta = badgeMeta[badge];
        const Icon = meta.icon;
        return (
          <Tooltip key={badge}>
            <TooltipTrigger asChild>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-background/60">
                <Icon className={cn("h-4 w-4", meta.className)} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{meta.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
