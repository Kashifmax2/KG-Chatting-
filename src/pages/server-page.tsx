import { useEffect } from "react";
import { Navigate, Outlet, useNavigate, useParams } from "react-router-dom";
import { getFirstTextChannel, getServer } from "@/data/servers";
import { useUIStore } from "@/stores/ui-store";
import { ChannelSidebar } from "@/components/layout/channel-sidebar";
import { MemberList } from "@/components/layout/member-list";

export default function ServerPage() {
  const { serverId, channelId } = useParams();
  const navigate = useNavigate();
  const server = serverId ? getServer(serverId) : undefined;
  const memberListOpen = useUIStore((s) => s.memberListOpen);

  // Landing on a bare server URL redirects to its first text channel.
  useEffect(() => {
    if (server && !channelId) {
      const first = getFirstTextChannel(server.id);
      if (first) navigate(`/servers/${server.id}/${first.id}`, { replace: true });
    }
  }, [server, channelId, navigate]);

  if (!server) return <Navigate to="/friends" replace />;

  return (
    <div className="flex h-full min-w-0 flex-1">
      <ChannelSidebar server={server} />
      <div className="flex min-w-0 flex-1 flex-col bg-chat">
        <Outlet />
      </div>
      {memberListOpen && channelId && <MemberList server={server} />}
    </div>
  );
}
