import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingScreen } from "@/components/shared/loading-screen";

/** Route guard: bounce unauthenticated visitors to the login screen. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  // Until the initial Firebase auth check resolves, don't decide either way.
  // AuthProvider already gates the tree on this, but guarding here too keeps
  // the redirect from racing the listener if the provider is ever bypassed.
  if (!authReady) {
    return <LoadingScreen label="Signing you in" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
