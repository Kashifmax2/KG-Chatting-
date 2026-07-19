import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrPanel } from "@/components/auth/qr-panel";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithGitHub = useAuthStore((s) => s.loginWithGitHub);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline "forgot password" flow (no separate route).
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    "/friends";

  // Already signed in? Don't show the login screen.
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, remember);
      // Success unmounts this component, so no post-await setState here.
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't sign you in.");
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send the email.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    setLoading(true);
    try {
      await (provider === "google" ? loginWithGoogle() : loginWithGitHub());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#5865f2] p-4">
      <AuthBackdrop />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-lg bg-card shadow-2xl"
      >
        <div className="flex-1 p-8">
          {mode === "login" ? (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold">Welcome back!</h1>
                <p className="mt-1 text-muted-foreground">
                  We're so excited to see you again!
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setResetSent(false);
                      setMode("reset");
                    }}
                    className="text-sm text-brand hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-brand"
                  />
                  Remember me
                </label>

                {error && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Log In
                </Button>

                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                    onClick={() => handleOAuth("google")}
                  >
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                    onClick={() => handleOAuth("github")}
                  >
                    GitHub
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  Need an account?{" "}
                  <Link to="/register" className="text-brand hover:underline">
                    Register
                  </Link>
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="mt-1 text-muted-foreground">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {resetSent ? (
                <div className="mt-6 space-y-4">
                  <p
                    role="status"
                    className="rounded-md bg-online/10 p-3 text-sm font-medium text-online"
                  >
                    If an account exists for {email}, a reset link is on its way.
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    onClick={() => setMode("login")}
                  >
                    Back to login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-sm font-medium text-destructive">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send reset link
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode("login");
                    }}
                    className="text-sm text-brand hover:underline"
                  >
                    Back to login
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <QrPanel />
      </motion.div>
    </div>
  );
}

/** Floating blurred blobs reminiscent of Discord's login art. */
function AuthBackdrop() {
  return (
    <>
      <motion.div
        className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl"
        animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
