import { useState } from "react";
import { MailWarning, X, Loader2, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

/**
 * A dismissible bar shown to signed-in users whose email isn't verified yet.
 *
 * Phase 04 lists "Email verification required" — we surface it prominently
 * without hard-blocking the app (which would trap OAuth users and complicate
 * onboarding). Two actions: resend the link, or re-check verification after the
 * user has clicked it (Firebase only refreshes `emailVerified` after a reload).
 */
export function VerifyEmailBanner() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const emailVerified = useAuthStore((s) => s.emailVerified);
  const resendVerification = useAuthStore((s) => s.resendVerification);
  const refreshVerification = useAuthStore((s) => s.refreshVerification);

  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!isAuthenticated || emailVerified || dismissed) return null;

  const handleResend = async () => {
    setNote(null);
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Couldn't send the email. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setNote(null);
    setChecking(true);
    try {
      const verified = await refreshVerification();
      // If still not verified, the banner stays; nudge the user.
      if (!verified) setNote("Not verified yet. Check your inbox, then try again.");
    } catch {
      setNote("Couldn't check right now. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200"
    >
      <MailWarning className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        {sent
          ? "Verification email sent. Check your inbox (and spam)."
          : note ?? "Please verify your email address to secure your account."}
      </span>

      <button
        type="button"
        onClick={handleResend}
        disabled={sending}
        className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium underline-offset-2 hover:underline disabled:opacity-60"
      >
        {sending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
        {sent ? "Resend" : "Resend email"}
      </button>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={checking}
        className="inline-flex items-center gap-1 rounded px-2 py-1 font-medium underline-offset-2 hover:underline disabled:opacity-60"
      >
        {checking ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="h-3 w-3" aria-hidden="true" />
        )}
        I've verified
      </button>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded p-1 hover:bg-yellow-500/20"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
