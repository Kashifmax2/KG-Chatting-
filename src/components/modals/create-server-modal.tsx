import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { getCurrentUser } from "@/data/users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
}

const templates = [
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "friends", label: "Friends", icon: "🎉" },
  { id: "study", label: "Study Group", icon: "📚" },
  { id: "creators", label: "Creators", icon: "🎨" },
];

export function CreateServerModal({ open, onClose }: Props) {
  const [step, setStep] = useState<"template" | "customize">("template");
  const [name, setName] = useState("");
  const user = getCurrentUser();
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  // Delay the reset so the dialog's close animation finishes on the current step.
  const closeAndReset = () => {
    onClose();
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setStep("template");
      setName("");
    }, 200);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeAndReset();
      }}
    >
      <DialogContent className="max-w-md">
        {step === "template" ? (
          <>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl">Create a server</DialogTitle>
              <DialogDescription>
                Your server is where you and your friends hang out. Make yours
                and start talking.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <button
                onClick={() => setStep("customize")}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left font-semibold transition-colors hover:border-brand hover:bg-accent/40"
              >
                <span className="text-2xl">✨</span>
                Create My Own
                <span className="ml-auto text-muted-foreground">›</span>
              </button>
              <p className="px-1 pt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Start from a template
              </p>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setName(`${user.displayName}'s ${t.label}`);
                    setStep("customize");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left font-semibold transition-colors hover:border-brand hover:bg-accent/40"
                >
                  <span className="text-2xl">{t.icon}</span>
                  {t.label}
                  <span className="ml-auto text-muted-foreground">›</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep("template")}
              className="absolute left-4 top-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl">Customize your server</DialogTitle>
              <DialogDescription>
                Give your new server a personality with a name and an icon. You
                can always change it later.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center">
              <button className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 text-muted-foreground transition-colors hover:border-brand hover:text-brand">
                <ImagePlus className="h-6 w-6" />
                <span className="text-[10px] font-bold uppercase">Upload</span>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name</Label>
              <Input
                id="server-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${user.displayName}'s server`}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                By creating a server, you agree to KG Chatting's Community
                Guidelines.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end gap-2"
            >
              <Button variant="ghost" onClick={() => setStep("template")}>
                Back
              </Button>
              <Button
                disabled={!name.trim()}
                onClick={closeAndReset}
              >
                Create
              </Button>
            </motion.div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
