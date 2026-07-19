import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  MessageCircle,
  MoreVertical,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { friends } from "@/data/social";
import { getUser, CURRENT_USER_ID } from "@/data/users";
import { dmChannels } from "@/data/dms";
import { HomeSidebar } from "@/components/layout/home-sidebar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { Friend, FriendStatus, User } from "@/types";

type Tab = "online" | "all" | "pending" | "blocked" | "add";

const tabs: { key: Tab; label: string }[] = [
  { key: "online", label: "Online" },
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "blocked", label: "Blocked" },
];

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>("online");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const setProfilePopup = useUIStore((s) => s.setProfilePopup);

  const rows = useMemo(() => {
    let list: Friend[] = friends;
    if (tab === "online")
      list = friends.filter(
        (f) => f.status === "friend" && getUser(f.userId)?.status !== "offline"
      );
    else if (tab === "all") list = friends.filter((f) => f.status === "friend");
    else if (tab === "pending")
      list = friends.filter(
        (f) => f.status === "pending_incoming" || f.status === "pending_outgoing"
      );
    else if (tab === "blocked")
      list = friends.filter((f) => f.status === "blocked");

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((f) =>
        getUser(f.userId)?.displayName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tab, query]);

  const openDM = (userId: string) => {
    const existing = dmChannels.find(
      (d) =>
        !d.isGroup &&
        d.participantIds.includes(userId) &&
        d.participantIds.includes(CURRENT_USER_ID)
    );
    if (existing) navigate(`/dm/${existing.id}`);
  };

  return (
    <div className="flex h-full min-w-0 flex-1">
      <HomeSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-chat">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border px-4">
          <div className="flex items-center gap-2 font-bold">
            <Users className="h-5 w-5 text-muted-foreground" />
            Friends
          </div>
          <div className="h-6 w-px bg-border" />
          <nav className="flex items-center gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm font-semibold transition-colors",
                  tab === t.key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
            <Button
              size="sm"
              onClick={() => setTab("add")}
              className={cn(
                "ml-1 h-7",
                tab === "add" && "bg-online hover:bg-online/90"
              )}
            >
              Add Friend
            </Button>
          </nav>
        </header>

        {tab === "add" ? (
          <AddFriend onBack={() => setTab("online")} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="p-4 pb-2">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="h-9 bg-rail pr-9"
                />
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <ScrollArea className="flex-1 px-4">
              <p className="mb-2 mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {tab === "pending" ? "Pending" : tab} — {rows.length}
              </p>
              {rows.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No one's around"
                  description="When you add friends, they'll show up here."
                />
              ) : (
                <div className="divide-y divide-border/60">
                  {rows.map((f) => {
                    const user = getUser(f.userId);
                    if (!user) return null;
                    return (
                      <FriendRow
                        key={f.userId}
                        user={user}
                        status={f.status}
                        onMessage={() => openDM(f.userId)}
                        onProfile={(e) => {
                          const rect =
                            e.currentTarget.getBoundingClientRect();
                          setProfilePopup({
                            user,
                            anchor: { x: rect.left, y: rect.top },
                          });
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

function FriendRow({
  user,
  status,
  onMessage,
  onProfile,
}: {
  user: User;
  status: FriendStatus;
  onMessage: () => void;
  onProfile: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      layout
      className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent/40"
    >
      <UserAvatar user={user} size="md" showStatus ringClassName="border-chat" />
      <button onClick={onProfile} className="min-w-0 flex-1 text-left">
        <p className="font-semibold">{user.displayName}</p>
        <p className="truncate text-sm text-muted-foreground">
          {status === "pending_incoming"
            ? "Incoming Friend Request"
            : status === "pending_outgoing"
            ? "Outgoing Friend Request"
            : user.customStatus ?? `${user.username}#${user.discriminator}`}
        </p>
      </button>

      <div className="flex items-center gap-2">
        {status === "pending_incoming" ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="secondary" className="rounded-full">
                  <Check className="h-5 w-5 text-online" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Accept</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="secondary" className="rounded-full">
                  <X className="h-5 w-5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ignore</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full"
                  onClick={onMessage}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Message</TooltipContent>
            </Tooltip>
            <Button size="icon" variant="secondary" className="rounded-full">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function AddFriend(_props: { onBack: () => void }) {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  // Clear the pending "success" timer if we unmount (e.g. tab switch) first.
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  return (
    <div className="border-b border-border p-4">
      <h2 className="font-bold">Add Friend</h2>
      <p className="text-sm text-muted-foreground">
        You can add friends with their username.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) {
            setSent(true);
            setValue("");
            window.clearTimeout(resetTimer.current);
            resetTimer.current = window.setTimeout(() => setSent(false), 2500);
          }
        }}
        className="mt-3 flex gap-2 rounded-lg bg-rail p-1.5"
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="You can use letters, numbers, or symbols."
          className="border-0 bg-transparent"
        />
        <Button type="submit" disabled={!value.trim()}>
          <UserPlus className="h-4 w-4" />
          Send Friend Request
        </Button>
      </form>
      {sent && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-online"
        >
          Success! Your friend request was sent.
        </motion.p>
      )}
    </div>
  );
}
