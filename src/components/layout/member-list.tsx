import { useMemo } from "react";
import { Crown } from "lucide-react";
import type { Server, User } from "@/types";
import { getUser } from "@/data/users";
import { useUIStore } from "@/stores/ui-store";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MemberRowProps {
  user: User;
  isOwner: boolean;
  roleColor?: string;
}

function MemberRow({ user, isOwner, roleColor }: MemberRowProps) {
  const setProfilePopup = useUIStore((s) => s.setProfilePopup);
  const offline = user.status === "offline";

  return (
    <button
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setProfilePopup({
          user,
          anchor: { x: rect.left - 300, y: rect.top },
        });
      }}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60",
        offline && "opacity-40 hover:opacity-100"
      )}
    >
      <UserAvatar user={user} size="sm" showStatus ringClassName="border-sidebar" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span
            className="truncate text-sm font-medium"
            style={roleColor ? { color: roleColor } : undefined}
          >
            {user.displayName}
          </span>
          {isOwner && <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
        </div>
        {user.customStatus && (
          <p className="truncate text-xs text-muted-foreground">
            {user.customStatus}
          </p>
        )}
      </div>
    </button>
  );
}

export function MemberList({ server }: { server: Server }) {
  /** Group members by their highest hoisted role, then online/offline. */
  const groups = useMemo(() => {
    const hoisted = server.roles
      .filter((r) => r.hoist)
      .sort((a, b) => b.position - a.position);

    const assigned = new Set<string>();
    const result: { name: string; color?: string; members: User[] }[] = [];

    for (const role of hoisted) {
      const members = role.memberIds
        .filter((id) => !assigned.has(id))
        .map((id) => getUser(id))
        .filter((u): u is User => Boolean(u) && u!.status !== "offline");
      members.forEach((m) => assigned.add(m.id));
      if (members.length) {
        result.push({ name: role.name, color: role.color, members });
      }
    }

    // Everyone else who is online.
    const online = server.memberIds
      .filter((id) => !assigned.has(id))
      .map((id) => getUser(id))
      .filter((u): u is User => Boolean(u) && u!.status !== "offline");
    if (online.length) {
      online.forEach((m) => assigned.add(m.id));
      result.push({ name: "Online", members: online });
    }

    // Offline members.
    const offline = server.memberIds
      .map((id) => getUser(id))
      .filter((u): u is User => Boolean(u) && u!.status === "offline");
    if (offline.length) {
      result.push({ name: "Offline", members: offline });
    }

    return result;
  }, [server]);

  return (
    <aside className="hidden w-60 flex-col bg-sidebar lg:flex">
      <ScrollArea className="flex-1 px-2 py-4">
        {groups.map((group) => (
          <div key={group.name} className="mb-4">
            <h4
              className="mb-1 px-2 text-xs font-bold uppercase tracking-wide"
              style={{ color: group.color ?? "hsl(var(--muted-foreground))" }}
            >
              {group.name} — {group.members.length}
            </h4>
            <div className="space-y-0.5">
              {group.members.map((user) => (
                <MemberRow
                  key={user.id}
                  user={user}
                  isOwner={user.id === server.ownerId}
                  roleColor={group.color}
                />
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </aside>
  );
}
