import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  LogOut,
  Monitor,
  Palette,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Volume2,
  X,
} from "lucide-react";
import { getCurrentUser } from "@/data/users";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/app/providers/theme-provider";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { UserBadges } from "@/components/shared/user-badges";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

const sections = [
  { id: "account", label: "My Account", icon: UserIcon },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "voice", label: "Voice & Video", icon: Volume2 },
  { id: "privacy", label: "Privacy & Safety", icon: ShieldCheck },
  { id: "devices", label: "Devices", icon: Monitor },
] as const;

type SectionId = (typeof sections)[number]["id"];

export function SettingsModal({ open, onClose }: Props) {
  const [active, setActive] = useState<SectionId>("account");
  const logout = useAuthStore((s) => s.logout);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <DialogPrimitive.Title className="sr-only">
            User Settings
          </DialogPrimitive.Title>
          {/* Sidebar */}
          <div className="flex w-56 shrink-0 flex-col items-end bg-sidebar py-12 pr-2">
            <nav className="w-44 space-y-0.5">
              <p className="px-2.5 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                User Settings
              </p>
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors",
                    active === s.id
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </button>
              ))}
              <Separator className="my-2" />
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="relative flex-1">
            <ScrollArea className="h-full">
              <div className="mx-auto max-w-2xl px-10 py-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <SectionContent id={active} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>

            <button
              onClick={onClose}
              className="absolute right-8 top-12 flex flex-col items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-current">
                <X className="h-5 w-5" />
              </span>
              <span className="mt-1 text-xs font-bold">ESC</span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

function SectionContent({ id }: { id: SectionId }) {
  const user = getCurrentUser();

  if (id === "account") {
    return (
      <div>
        <h2 className="mb-4 text-xl font-bold">My Account</h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="h-24" style={{ backgroundColor: user.bannerColor }} />
          <div className="flex items-center gap-3 px-4 pb-4">
            <UserAvatar
              user={user}
              size="xl"
              className="-mt-10 ring-[6px] ring-card"
              showStatus
              ringClassName="border-card"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-bold">{user.displayName}</span>
              <UserBadges badges={user.badges} />
            </div>
            <Button size="sm" className="mb-1 ml-auto mt-2">
              Edit User Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (id === "appearance") return <AppearanceSection />;

  const copy: Record<Exclude<SectionId, "account" | "appearance">, string> = {
    notifications: "Choose how and when KG Chatting notifies you.",
    voice: "Pick your input and output devices and tune your mic.",
    privacy: "Control who can contact you and how your data is used.",
    devices: "Here are all the devices currently logged into your account.",
  };

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold capitalize">{id.replace("_", " ")}</h2>
      <p className="mb-6 text-muted-foreground">
        {copy[id as keyof typeof copy]}
      </p>
      <div className="space-y-3">
        {["Enable feature", "Play sounds", "Show badges", "Sync across devices"].map(
          (label, i) => (
            <ToggleRow key={label} label={label} defaultOn={i % 2 === 0} />
          )
        )}
      </div>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Appearance</h2>
      <p className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Theme
      </p>
      <div className="flex gap-3">
        {(["dark", "light"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              "flex-1 overflow-hidden rounded-xl border-2 transition-colors",
              theme === t ? "border-brand" : "border-transparent hover:border-border"
            )}
          >
            <div
              className={cn(
                "flex h-24 items-end p-2",
                t === "dark" ? "bg-[#1e1f22]" : "bg-[#f2f3f5]"
              )}
            >
              <div
                className={cn(
                  "h-3 w-full rounded-full",
                  t === "dark" ? "bg-white/20" : "bg-black/20"
                )}
              />
            </div>
            <div className="flex items-center justify-center gap-2 bg-card py-2 text-sm font-semibold capitalize">
              {theme === t && <Sparkles className="h-4 w-4 text-brand" />}
              {t}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  defaultOn,
}: {
  label: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(Boolean(defaultOn));
  return (
    <div className="flex items-center justify-between rounded-lg bg-rail px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={on} onCheckedChange={setOn} />
    </div>
  );
}
