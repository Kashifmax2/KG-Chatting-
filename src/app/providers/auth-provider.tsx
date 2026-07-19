import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingScreen } from "@/components/shared/loading-screen";

/**
 * Starts the Firebase auth listener once at app boot and holds the app on a
 * branded loading screen until the initial auth-state check resolves.
 *
 * Gating the whole tree on `authReady` here means neither the protected routes
 * nor the public login/register pages flash the wrong state on a hard refresh:
 * we simply don't render routes until Firebase has told us whether a session
 * exists. The listener's unsubscribe is returned from `init()` and cleaned up
 * on unmount (StrictMode-safe).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authReady = useAuthStore((s) => s.authReady);
  const init = useAuthStore((s) => s.init);
  // Guard against React 18/19 StrictMode double-invoking the effect in dev.
  const [started] = useState(() => ({ done: false }));

  useEffect(() => {
    if (started.done) return;
    started.done = true;
    const unsubscribe = init();
    return () => {
      started.done = false;
      unsubscribe();
    };
  }, [init, started]);

  if (!authReady) {
    return (
      <div className="h-screen w-screen">
        <LoadingScreen label="Signing you in" />
      </div>
    );
  }

  return <>{children}</>;
}
