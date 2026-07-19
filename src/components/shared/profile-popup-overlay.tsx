import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/ui-store";
import { ProfilePopupCard } from "@/components/shared/profile-popup";
import { CURRENT_USER_ID } from "@/data/users";
import { dmChannels } from "@/data/dms";

/**
 * Renders the floating profile card anchored near wherever it was triggered.
 * Clicking the backdrop dismisses it.
 */
export function ProfilePopupOverlay() {
  const popup = useUIStore((s) => s.profilePopup);
  const setPopup = useUIStore((s) => s.setProfilePopup);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPopup(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPopup]);

  const handleMessage = () => {
    if (!popup) return;
    const existing = dmChannels.find(
      (d) =>
        !d.isGroup &&
        d.participantIds.includes(popup.user.id) &&
        d.participantIds.includes(CURRENT_USER_ID)
    );
    setPopup(null);
    if (existing) navigate(`/dm/${existing.id}`);
    else navigate("/friends");
  };

  // Clamp the anchor so the card stays on-screen.
  const top = popup
    ? Math.min(Math.max(popup.anchor.y, 12), window.innerHeight - 380)
    : 0;
  const left = popup ? Math.max(popup.anchor.x, 12) : 0;

  return (
    <AnimatePresence>
      {popup && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setPopup(null)}
        >
          <div
            className="absolute"
            style={{ top, left }}
            onClick={(e) => e.stopPropagation()}
          >
            <ProfilePopupCard
              user={popup.user}
              onMessage={
                popup.user.id !== CURRENT_USER_ID ? handleMessage : undefined
              }
            />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
