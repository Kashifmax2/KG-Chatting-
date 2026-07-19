import { useUIStore } from "@/stores/ui-store";
import { CreateServerModal } from "@/components/modals/create-server-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { SettingsModal } from "@/components/modals/settings-modal";
import { SearchModal } from "@/components/modals/search-modal";

/** Mounts every global modal and shows whichever one the UI store has active. */
export function GlobalModals() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);

  return (
    <>
      <CreateServerModal
        open={activeModal === "createServer"}
        onClose={closeModal}
      />
      <InviteModal open={activeModal === "inviteFriends"} onClose={closeModal} />
      <SettingsModal open={activeModal === "settings"} onClose={closeModal} />
      <SearchModal open={activeModal === "search"} onClose={closeModal} />
    </>
  );
}
