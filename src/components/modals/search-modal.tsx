import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, Search, Volume2 } from "lucide-react";
import { servers } from "@/data/servers";
import { users } from "@/data/users";
import { dmChannels } from "@/data/dms";
import { getUser, CURRENT_USER_ID } from "@/data/users";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Result =
  | { kind: "channel"; id: string; serverId: string; name: string; type: string }
  | { kind: "user"; id: string; name: string }
  | { kind: "dm"; id: string; name: string };

export function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Result[] = [];

    for (const server of servers) {
      for (const category of server.categories) {
        for (const channel of category.channels) {
          if (channel.name.toLowerCase().includes(q)) {
            out.push({
              kind: "channel",
              id: channel.id,
              serverId: server.id,
              name: channel.name,
              type: channel.type,
            });
          }
        }
      }
    }

    for (const user of users) {
      if (
        user.id !== CURRENT_USER_ID &&
        (user.displayName.toLowerCase().includes(q) ||
          user.username.toLowerCase().includes(q))
      ) {
        out.push({ kind: "user", id: user.id, name: user.displayName });
      }
    }

    return out.slice(0, 8);
  }, [query]);

  const go = (r: Result) => {
    onClose();
    setQuery("");
    if (r.kind === "channel") navigate(`/servers/${r.serverId}/${r.id}`);
    else if (r.kind === "user") {
      const dm = dmChannels.find(
        (d) => !d.isGroup && d.participantIds.includes(r.id)
      );
      navigate(dm ? `/dm/${dm.id}` : "/friends");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setQuery("");
        }
      }}
    >
      <DialogContent hideClose className="max-w-xl gap-0 p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Where would you like to go?"
            className="border-0 bg-transparent px-0 text-base focus-visible:ring-0"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query && results.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results for "{query}"
            </p>
          )}
          {!query && (
            <p className="px-2 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Search for channels and people
            </p>
          )}
          {results.map((r) => (
            <button
              key={`${r.kind}-${r.id}`}
              onClick={() => go(r)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/60"
              )}
            >
              {r.kind === "user" ? (
                <UserAvatar user={getUser(r.id)!} size="sm" ringClassName="border-card" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center text-muted-foreground">
                  {r.kind === "channel" && r.type === "voice" ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <Hash className="h-5 w-5" />
                  )}
                </span>
              )}
              <span className="flex-1 truncate font-medium">{r.name}</span>
              <span className="text-xs text-muted-foreground">
                {r.kind === "user" ? "Direct Message" : "Channel"}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
