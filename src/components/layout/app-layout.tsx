import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServerRail } from "@/components/layout/server-rail";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { GlobalModals } from "@/components/modals/global-modals";
import { ProfilePopupOverlay } from "@/components/shared/profile-popup-overlay";
import { ImageLightbox } from "@/components/shared/image-lightbox";
import { VerifyEmailBanner } from "@/components/auth/verify-email-banner";

/**
 * The persistent chrome: the server rail on the left plus whatever the current
 * route renders. Modals and overlays mount here so they float above everything.
 */
export function AppLayout() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        <VerifyEmailBanner />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ServerRail />
          <div className="flex min-w-0 flex-1 overflow-hidden rounded-tl-xl border-l border-t border-border bg-chat">
            <Suspense fallback={<LoadingScreen />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Global floating UI */}
      <GlobalModals />
      <ProfilePopupOverlay />
      <ImageLightbox />
    </TooltipProvider>
  );
}
