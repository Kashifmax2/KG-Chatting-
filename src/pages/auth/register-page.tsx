import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  validateEmail,
  validateUsername,
  validatePasswordStrength,
  passwordStrengthScore,
  validateDisplayName,
} from "@/validators";

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Skip registration.
  if (isAuthenticated) {
    return <Navigate to="/friends" replace />;
  }

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const strength = passwordStrengthScore(form.password);
  const strengthLabel =
    ["Too weak", "Weak", "Fair", "Good", "Strong"][strength] ?? "";

  /** Run the reusable validators before hitting the network. */
  const validate = (): string | null => {
    for (const check of [
      validateEmail(form.email),
      validateUsername(form.username),
      validatePasswordStrength(form.password),
      // Display name is optional; only validate when provided.
      form.displayName.trim() ? validateDisplayName(form.displayName) : { ok: true, message: "" },
    ]) {
      if (!check.ok) return check.message;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        username: form.username,
        password: form.password,
        displayName: form.displayName,
      });
      // Success unmounts this component, so no post-await setState here.
      navigate("/friends", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't create your account. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#5865f2] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative z-10 w-full max-w-md rounded-lg bg-card p-8 shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={update("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={form.displayName} onChange={update("displayName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" required value={form.username} onChange={update("username")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={update("password")}
              autoComplete="new-password"
              aria-describedby="password-strength"
            />
            {form.password && (
              <div id="password-strength" className="space-y-1" aria-live="polite">
                <div className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength
                          ? strength <= 2
                            ? "bg-destructive"
                            : strength === 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{strengthLabel}</p>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue
          </Button>

          <p className="text-sm">
            <Link to="/login" className="text-brand hover:underline">
              Already have an account?
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
