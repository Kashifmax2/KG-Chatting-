import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Ban, Copy, UserMinus } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useDMStore } from "@/stores/dm-store";
import { useAuthStore } from "@/stores/auth-store";
import { useFriendsStore } from "@/stores/friends-store";
import {
  ProfilePopupCard,
  type ProfileCardAction,
} from "@/components/shared/profile-popup";
import { CURRENT_USER_ID } from "@/data/users";

/** Best-effort copy-to-clipboard; silently ignored where unavailable. */
async function copyUsername(username: string): Promise<void> {
  try {
    await navigator.clipboard?.writeText(username);
  } catch {
    /* clipboard unavailable in some sandboxes; ignore */
  }
}

/**
 * Renders the floating profile card anchored near wherever it was triggered.
 * Clicking the backdrop dismisses it.
 */
export function ProfilePopupOverlay() {
  const popup = useUIStore((s) => s.profilePopup);
  const setPopup = useUIStore((s) => s.setProfilePopup);
  const openOrCreateDM = useDMStore((s) => s.openOrCreateDM);
  const uid = useAuthStore((s) => s.user?.id ?? null);
  const subscribe = useFriendsStore((s) => s.subscribe);
  const friends = useFriendsStore((s) => s.friends);
  const sendRequest = useFriendsStore((s) => s.sendRequest);
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const blockUser = useFriendsStore((s) => s.blockUser);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPopup(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPopup]);

  // Keep a (ref-counted, idempotent) friends subscription so the popup can tell
  // friend from non-friend wherever it opens, not just on the friends page.
  useEffect(() => {
    if (!uid) return;
    return subscribe(uid);
  }, [uid, subscribe]);

  // Keep the social graph live so relationship-aware actions (add / remove /
  // block) are correct wherever the popup is triggered. Ref-counted and
  // idempotent, so this shares one listener set with the friends page.
  useEffect(() => {
    if (!uid) return;
    return subscribe(uid);
  }, [uid, subscribe]);

  const user = popup?.user;
  const isSelf = user?.id === CURRENT_USER_ID;
  const isFriend = useMemo(
    () => Boolean(user && friends.some((f) => f.userId === user.id)),
    [user, friends]
  );

  const handleMessage = () => {
    if (!user) return;
    const dmId = openOrCreateDM(user);
    setPopup(null);
    navigate(`/dm/${dmId}`);
  };

  const actions: ProfileCardAction[] = useMemo(() => {
    if (!user || isSelf) return [];
    const list: ProfileCardAction[] = [
      {
        key: "copy",
        label: "Copy Username",
        icon: Copy,
        onSelect: () => void copyUsername(user.username),
      },
    ];
    if (isFriend) {
      list.push({
        key: "remove",
        label: "Remove Friend",
        icon: UserMinus,
        destructive: true,
        onSelect: () => {
          void removeFriend(user.id);
          setPopup(null);
        },
      });
    }
    list.push({
      key: "block",
      label: "Block",
      icon: Ban,
      destructive: true,
      onSelect: () => {
        void blockUser(user.id);
        setPopup(null);
      },
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSelf, isFriend]);

  // Offer a quick "add friend" only for non-friends who aren't the current user.
  const handleAddFriend =
    user && !isSelf && !isFriend
      ? () => {
          void sendRequest(user.username);
          setPopup(null);
        }
      : undefined;

  // Clamp the anchor so the card stays on-screen.
  const top = popup
    ? Math.min(Math.max(popup.anchor.y, 12), window.innerHeight - 380)
    : 0;
  const left = popup ? Math.max(popup.anchor.x, 12) : 0;

  return (
    <AnimatePresence>
      {popup && user && (
        <div className="fixed inset-0 z-[60]" onClick={() => setPopup(null)}>
          <div
            className="absolute"
            style={{ top, left }}
            onClick={(e) => e.stopPropagation()}
          >
            <ProfilePopupCard
              user={user}
              onMessage={isSelf ? undefined : handleMessage}
              onAddFriend={handleAddFriend}
              actions={actions}
            />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
