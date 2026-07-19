import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { useAuthStore, useCurrentUser } from "@/stores/auth-store";
import { useProfileStore } from "@/stores/profile-store";
import { HomeSidebar } from "@/components/layout/home-sidebar";
import { UserAvatar } from "@/components/shared/user-avatar";
import { UserBadges } from "@/components/shared/user-badges";
import { ProfilePopupCard } from "@/components/shared/profile-popup";
import { StatusDot } from "@/components/shared/status-dot";
import { EditProfileModal } from "@/components/modals/edit-profile-modal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const user = useCurrentUser();
  const logout = useAuthStore((s) => s.logout);
  const subscribe = useProfileStore((s) => s.subscribe);
  const [editing, setEditing] = useState(false);

  // Keep the signed-in user's profile live while this page is open.
  useEffect(() => {
    if (!user?.id) return;
    return subscribe(user.id);
  }, [user?.id, subscribe]);

  if (!user) return null;

  return (
    <div className="flex h-full min-w-0 flex-1">
      <HomeSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-chat">
        <header className="flex h-12 shrink-0 items-center border-b border-border px-4">
          <h1 className="font-bold">My Account</h1>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive"
            onClick={logout}
          >
            Log Out
          </Button>
        </header>

        <ScrollArea className="flex-1">
          <div className="mx-auto grid max-w-4xl gap-6 p-6 lg:grid-cols-[1fr,20rem]">
            {/* Editable account card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div
                className="h-28 bg-cover bg-center"
                style={
                  user.bannerUrl
                    ? { backgroundImage: `url(${user.bannerUrl})` }
                    : { backgroundColor: user.bannerColor }
                }
              />
              <div className="px-5 pb-5">
                <div className="-mt-12 mb-3 flex items-end justify-between">
                  <UserAvatar
                    user={user}
                    size="xl"
                    showStatus
                    className="h-24 w-24 ring-[6px] ring-card"
                    ringClassName="border-card"
                  />
                  <Button size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black">{user.displayName}</h2>
                  <UserBadges badges={user.badges} />
                </div>
                <p className="text-muted-foreground">
                  {user.username}#{user.discriminator}
                </p>

                <Separator className="my-4" />

                <Field
                  label="Display Name"
                  value={user.displayName}
                  onEdit={() => setEditing(true)}
                />
                <Field
                  label="Username"
                  value={user.username}
                  onEdit={() => setEditing(true)}
                />
                <Field
                  label="Pronouns"
                  value={user.pronouns || "Not set"}
                  onEdit={() => setEditing(true)}
                />
                <Field
                  label="Status"
                  value={<StatusDot status={user.status} withLabel />}
                  onEdit={() => setEditing(true)}
                />
                <Field
                  label="About Me"
                  value={user.bio || "Not set"}
                  onEdit={() => setEditing(true)}
                />
              </div>
            </motion.div>

            {/* Live preview */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Preview
              </p>
              <ProfilePopupCard user={user} className="w-full" compact />
            </div>
          </div>
        </ScrollArea>
      </div>

      <EditProfileModal open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}

function Field({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4 rounded-lg bg-rail px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 truncate text-sm">{value}</div>
      </div>
      <Button size="sm" variant="secondary" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}
