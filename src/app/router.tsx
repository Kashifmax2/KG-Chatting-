import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { RequireAuth } from "@/app/providers/require-auth";

// Lazy-loaded routes keep the initial bundle lean.
const LoginPage = lazy(() => import("@/pages/auth/login-page"));
const RegisterPage = lazy(() => import("@/pages/auth/register-page"));
const FriendsPage = lazy(() => import("@/pages/friends-page"));
const NotificationsPage = lazy(() => import("@/pages/notifications-page"));
const DMPage = lazy(() => import("@/pages/dm-page"));
const ServerPage = lazy(() => import("@/pages/server-page"));
const ChannelPage = lazy(() => import("@/pages/channel-page"));
const ExplorePage = lazy(() => import("@/pages/explore-page"));
const ProfilePage = lazy(() => import("@/pages/profile-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found-page"));

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/friends" replace /> },
      { path: "friends", element: <FriendsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "dm/:dmId", element: <DMPage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "me", element: <ProfilePage /> },
      {
        path: "servers/:serverId",
        element: <ServerPage />,
        children: [{ path: ":channelId", element: <ChannelPage /> }],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
