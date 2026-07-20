import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Ban,
  Check,
  Copy,
  MessageCircle,
  MoreVertical,
  Search,
  Star,
  StarOff,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useDMStore } from "@/stores/dm-store";
import { HomeSidebar } from "@/components/layout/home-sidebar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import {
  useFriendsStore,
  useFriends,
  useOnlineFriends,
  usePendingRequests,
  useBlockedUsers,
  friendDisplayName,
  type FriendWithUser,
  type PendingEntry,
} from "@/stores/friends-store";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

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
  const openOrCreateDM = useDMStore((s) => s.openOrCreateDM);

  const uid = useAuthStore((s) => s.user?.id ?? null);
  const subscribe = useFriendsStore((s) => s.subscribe);
  const loading = useFriendsStore((s) => s.loading);
  const error = useFriendsStore((s) => s.error);
  const clearError = useFriendsStore((s) => s.clearError);

  // Store actions.
  const acceptRequest = useFriendsStore((s) => s.acceptRequest);
  const declineRequest = useFriendsStore((s) => s.declineRequest);
  const cancelRequest = useFriendsStore((s) => s.cancelRequest);
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const blockUser = useFriendsStore((s) => s.blockUser);
  const unblockUser = useFriendsStore((s) => s.unblockUser);
  const toggleFavorite = useFriendsStore((s) => s.toggleFavorite);

  // Derived, profile-joined views.
  const online = useOnlineFriends();
  const all = useFriends();
  const pending = usePendingRequests();
  const blocked = useBlockedUsers();

  const [confirm, setConfirm] = useState<
    | { kind: "remove" | "block"; user: User }
    | null
  >(null);

  // Open realtime listeners while this page (and the user) is present.
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribe(uid);
    return unsub;
  }, [uid, subscribe]);

  // Clear a stale error when switching tabs.
  useEffect(() => {
    clearError();
  }, [tab, clearError]);

  const filterByName = <T,>(list: T[], name: (item: T) => string): T[] => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => name(item).toLowerCase().includes(q));
  };

  const openDM = (user: User) => {
    // Open the existing 1:1 DM, or create one, then navigate to it.
    const dmId = openOrCreateDM(user);
    navigate(`/dm/${dmId}`);
  };

  const openProfile = (user: User, anchor: { x: number; y: number }) => {
    setProfilePopup({ user, anchor });
  };

  const visibleFriends = useMemo(
    () =>
      filterByName(tab === "online" ? online : all, (f) => friendDisplayName(f)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, online, all, query]
  );
  const visiblePending = useMemo(
    () => filterByName(pending, (p) => p.user.displayName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pending, query]
  );
  const visibleBlocked = useMemo(
    () => filterByName(blocked, (b) => b.user.displayName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [blocked, query]
  );

  const count =
    tab === "pending"
      ? visiblePending.length
      : tab === "blocked"
      ? visibleBlocked.length
      : visibleFriends.length;

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
                  "relative rounded-md px-2.5 py-1 text-sm font-semibold transition-colors",
                  tab === t.key
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {t.label}
                {t.key === "pending" && pending.some((p) => p.direction === "incoming") && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {pending.filter((p) => p.direction === "incoming").length}
                  </span>
                )}
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
          <AddFriend />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="px-4 pb-1 pt-4">
              <div className="group relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="h-9 bg-rail pl-9 pr-9"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 px-4">
              <p className="mb-1.5 mt-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {tab === "pending" ? "Pending" : tab === "blocked" ? "Blocked" : tab === "online" ? "Online" : "All Friends"} — {count}
              </p>

              {error && (
                <p className="mb-2 rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              {loading ? (
                <ListSkeleton />
              ) : tab === "pending" ? (
                visiblePending.length === 0 ? (
                  <EmptyState
                    icon={UserPlus}
                    title="No pending requests"
                    description="Friend requests you send or receive will appear here."
                  />
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {visiblePending.map((p) => (
                      <PendingRow
                        key={`${p.direction}-${p.user.id}`}
                        entry={p}
                        onAccept={() => acceptRequest(p.user.id)}
                        onDecline={() =>
                          p.direction === "incoming"
                            ? declineRequest(p.user.id)
                            : cancelRequest(p.user.id)
                        }
                        onProfile={(anchor) => openProfile(p.user, anchor)}
                      />
                    ))}
                  </div>
                )
              ) : tab === "blocked" ? (
                visibleBlocked.length === 0 ? (
                  <EmptyState
                    icon={Ban}
                    title="No blocked users"
                    description="You haven't blocked anyone."
                  />
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {visibleBlocked.map((b) => (
                      <BlockedRow
                        key={b.user.id}
                        user={b.user}
                        onUnblock={() => unblockUser(b.user.id)}
                        onProfile={(anchor) => openProfile(b.user, anchor)}
                      />
                    ))}
                  </div>
                )
              ) : visibleFriends.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No one's around"
                  description="When you add friends, they'll show up here."
                />
              ) : (
                <div className="flex flex-col gap-0.5">
                  {visibleFriends.map((f) => (
                    <FriendRow
                      key={f.user.id}
                      fw={f}
                      onMessage={() => openDM(f.user)}
                      onProfile={(anchor) => openProfile(f.user, anchor)}
                      onToggleFavorite={() => toggleFavorite(f.user.id)}
                      onRemove={() => setConfirm({ kind: "remove", user: f.user })}
                      onBlock={() => setConfirm({ kind: "block", user: f.user })}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Destructive-action confirmations. */}
      <ConfirmDialog
        open={confirm?.kind === "remove"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Remove '${confirm?.user.displayName}'`}
        description={
          <>
            Are you sure you want to remove{" "}
            <span className="font-semibold">{confirm?.user.displayName}</span>{" "}
            from your friends?
          </>
        }
        confirmLabel="Remove Friend"
        onConfirm={async () => {
          if (confirm) await removeFriend(confirm.user.id);
        }}
      />
      <ConfirmDialog
        open={confirm?.kind === "block"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Block '${confirm?.user.displayName}'`}
        description={
          <>
            Blocking{" "}
            <span className="font-semibold">{confirm?.user.displayName}</span>{" "}
            removes them as a friend and hides their messages. You can unblock
            them later.
          </>
        }
        confirmLabel="Block"
        onConfirm={async () => {
          if (confirm) await blockUser(confirm.user.id);
        }}
      />
    </div>
  );
}

// ---- Rows ------------------------------------------------------------------

type Anchor = { x: number; y: number };

/** A single row action, rendered into both the right-click and the ⋯ menu. */
interface RowAction {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  separatorBefore?: boolean;
}

/** Copy a username to the clipboard (best-effort — clipboard may be blocked). */
async function copyUsername(username: string) {
  try {
    await navigator.clipboard.writeText(username);
  } catch {
    /* clipboard unavailable — nothing actionable to surface here */
  }
}

/** Anchor the profile popup just below-left of a row element. */
function rowAnchor(el: HTMLElement | null): Anchor {
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  return { x: rect.left, y: rect.bottom + 8 };
}

function FriendRow({
  fw,
  onMessage,
  onProfile,
  onToggleFavorite,
  onRemove,
  onBlock,
}: {
  fw: FriendWithUser;
  onMessage: () => void;
  onProfile: (anchor: Anchor) => void;
  onToggleFavorite: () => void;
  onRemove: () => void;
  onBlock: () => void;
}) {
  const { user, edge } = fw;
  const name = friendDisplayName(fw);
  const rowRef = useRef<HTMLDivElement>(null);

  const actions: RowAction[] = [
    { key: "profile", label: "View Profile", icon: UserRound, onSelect: () => onProfile(rowAnchor(rowRef.current)) },
    { key: "message", label: "Message", icon: MessageCircle, onSelect: onMessage },
    {
      key: "favorite",
      label: edge.favorite ? "Remove Favorite" : "Add Favorite",
      icon: edge.favorite ? StarOff : Star,
      onSelect: onToggleFavorite,
    },
    { key: "copy", label: "Copy Username", icon: Copy, onSelect: () => void copyUsername(user.username) },
    { key: "remove", label: "Remove Friend", icon: UserMinus, onSelect: onRemove, destructive: true, separatorBefore: true },
    { key: "block", label: "Block", icon: Ban, onSelect: onBlock, destructive: true },
  ];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          ref={rowRef}
          layout
          className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50"
        >
          <button
            onClick={() => onProfile(rowAnchor(rowRef.current))}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <UserAvatar user={user} size="md" showStatus ringClassName="border-chat" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate font-semibold leading-tight">
                <span className="truncate">{name}</span>
                {edge.favorite && (
                  <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {user.customStatus ?? user.username}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 rounded-full"
                  onClick={onMessage}
                  aria-label={`Message ${name}`}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Message</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 rounded-full data-[state=open]:bg-accent"
                      aria-label={`More options for ${name}`}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>More</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-52">
                {actions.map((a) => (
                  <div key={a.key}>
                    {a.separatorBefore && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      variant={a.destructive ? "destructive" : "default"}
                      onSelect={a.onSelect}
                    >
                      <a.icon className="h-4 w-4" />
                      {a.label}
                    </DropdownMenuItem>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {actions.map((a) => (
          <div key={a.key}>
            {a.separatorBefore && <ContextMenuSeparator />}
            <ContextMenuItem
              variant={a.destructive ? "destructive" : "default"}
              onSelect={a.onSelect}
            >
              <a.icon className="h-4 w-4" />
              {a.label}
            </ContextMenuItem>
          </div>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function PendingRow({
  entry,
  onAccept,
  onDecline,
  onProfile,
}: {
  entry: PendingEntry;
  onAccept: () => void;
  onDecline: () => void;
  onProfile: (anchor: Anchor) => void;
}) {
  const { user, direction } = entry;
  const rowRef = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={rowRef}
      layout
      className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50"
    >
      <button
        onClick={() => onProfile(rowAnchor(rowRef.current))}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <UserAvatar user={user} size="md" showStatus ringClassName="border-chat" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{user.displayName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {direction === "incoming"
              ? "Incoming Friend Request"
              : "Outgoing Friend Request"}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1.5 opacity-70 transition-opacity group-hover:opacity-100">
        {direction === "incoming" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full hover:bg-online/20"
                onClick={onAccept}
                aria-label="Accept request"
              >
                <Check className="h-5 w-5 text-online" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accept</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full hover:bg-destructive/20"
              onClick={onDecline}
              aria-label={direction === "incoming" ? "Ignore request" : "Cancel request"}
            >
              <X className="h-5 w-5 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {direction === "incoming" ? "Ignore" : "Cancel"}
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.div>
  );
}

function BlockedRow({
  user,
  onUnblock,
  onProfile,
}: {
  user: User;
  onUnblock: () => void;
  onProfile: (anchor: Anchor) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          ref={rowRef}
          layout
          className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50"
        >
          <button
            onClick={() => onProfile(rowAnchor(rowRef.current))}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <UserAvatar user={user} size="md" ringClassName="border-chat" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight">{user.displayName}</p>
              <p className="truncate text-sm text-muted-foreground">Blocked</p>
            </div>
          </button>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full opacity-80 transition-opacity group-hover:opacity-100"
            onClick={onUnblock}
          >
            <UserPlus className="h-4 w-4" />
            Unblock
          </Button>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onSelect={() => onProfile(rowAnchor(rowRef.current))}>
          <UserRound className="h-4 w-4" />
          View Profile
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => void copyUsername(user.username)}>
          <Copy className="h-4 w-4" />
          Copy Username
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onUnblock}>
          <UserPlus className="h-4 w-4" />
          Unblock
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Add friend ------------------------------------------------------------

function AddFriend() {
  const [value, setValue] = useState("");
  const [ok, setOk] = useState(false);
  const sendRequest = useFriendsStore((s) => s.sendRequest);
  const busy = useFriendsStore((s) => s.busy);
  const error = useFriendsStore((s) => s.error);
  const clearError = useFriendsStore((s) => s.clearError);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    setOk(false);
    const success = await sendRequest(name);
    if (success) {
      setOk(true);
      setValue("");
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-bold">Add Friend</h2>
      <p className="text-sm text-muted-foreground">
        You can add friends with their username.
      </p>
      <form
        onSubmit={submit}
        className={cn(
          "mt-3 flex gap-2 rounded-lg bg-rail p-1.5 ring-1 ring-transparent",
          error && "ring-destructive"
        )}
      >
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (ok) setOk(false);
            if (error) clearError();
          }}
          placeholder="You can use letters, numbers, or symbols."
          className="border-0 bg-transparent"
        />
        <Button type="submit" disabled={!value.trim() || busy}>
          <UserPlus className="h-4 w-4" />
          {busy ? "Sending…" : "Send Friend Request"}
        </Button>
      </form>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}
      {ok && !error && (
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
