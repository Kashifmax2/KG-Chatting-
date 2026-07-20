import { useEffect, useRef, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/auth-store";
import { useFriendsStore, useFriends } from "@/stores/friends-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

const INVITE_LINK = "https://kg.gg/aBc123XyZ";

export function InviteModal({ open, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const copiedTimer = useRef<number | undefined>(undefined);

  const uid = useAuthStore((s) => s.user?.id ?? null);
  const subscribe = useFriendsStore((s) => s.subscribe);
  const friendsList = useFriends();

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  // Ensure the friend graph is live while the modal is open (idempotent —
  // shares listeners with the friends page if it's already mounted).
  useEffect(() => {
    if (!open || !uid) return;
    return subscribe(uid);
  }, [open, uid, subscribe]);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(INVITE_LINK);
    } catch {
      /* clipboard unavailable in some sandboxes; ignore */
    }
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const list = friendsList
    .map((f) => f.user)
    .filter((u) =>
      u.displayName.toLowerCase().includes(query.trim().toLowerCase())
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite friends</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for friends"
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-1 pr-2">
            {list.map((u) => {
              const isInvited = invited.has(u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/40"
                >
                  <UserAvatar user={u} size="sm" showStatus ringClassName="border-card" />
                  <span className="flex-1 truncate text-sm font-medium">
                    {u.displayName}
                  </span>
                  <Button
                    size="sm"
                    variant={isInvited ? "secondary" : "outline"}
                    onClick={() =>
                      setInvited((prev) => {
                        const next = new Set(prev);
                        if (next.has(u.id)) next.delete(u.id);
                        else next.add(u.id);
                        return next;
                      })
                    }
                  >
                    {isInvited ? "Sent" : "Invite"}
                  </Button>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Or, send a server invite link to a friend
          </p>
          <div className="flex gap-2 rounded-lg bg-rail p-1.5">
            <Input
              readOnly
              value={INVITE_LINK}
              className="border-0 bg-transparent"
            />
            <Button onClick={copy} className="shrink-0">
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Your invite link expires in 7 days.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
