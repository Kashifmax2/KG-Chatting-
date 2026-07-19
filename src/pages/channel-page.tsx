import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Hash } from "lucide-react";
import { getChannel, getServer } from "@/data/servers";
import { useChatStore, EMPTY_TYPING } from "@/stores/chat-store";
import { useSimulatedTyping } from "@/hooks/use-simulated-typing";
import { ChannelHeader } from "@/components/layout/channel-header";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/composer";
import { ChannelWelcome } from "@/components/chat/channel-welcome";
import { EmptyState } from "@/components/shared/empty-state";
import { VoiceChannelView } from "@/components/chat/voice-channel-view";

export default function ChannelPage() {
  const { serverId, channelId } = useParams();
  const server = serverId ? getServer(serverId) : undefined;
  const channel = channelId ? getChannel(channelId)?.channel : undefined;

  const ensureChannel = useChatStore((s) => s.ensureChannel);
  const messages = useChatStore((s) =>
    channelId ? s.messages[channelId] : undefined
  );
  const typing = useChatStore((s) =>
    channelId ? s.typing[channelId] ?? EMPTY_TYPING : EMPTY_TYPING
  );

  useEffect(() => {
    if (channelId) ensureChannel(channelId);
  }, [channelId, ensureChannel]);

  // Simulate other members typing using the server roster.
  const candidates = useMemo(
    () => (server ? server.memberIds.slice(1, 5) : []),
    [server]
  );
  useSimulatedTyping(channelId ?? "", candidates);

  if (!channel) {
    return (
      <EmptyState
        icon={Hash}
        title="Channel not found"
        description="This channel may have been deleted or moved."
        className="flex-1"
      />
    );
  }

  if (channel.type === "voice") {
    return <VoiceChannelView channel={channel} />;
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <ChannelHeader channel={channel} />
      <MessageList
        channelId={channel.id}
        messages={messages ?? []}
        header={<ChannelWelcome channel={channel} />}
      />
      <Composer
        channelId={channel.id}
        placeholder={`Message #${channel.name}`}
        typingUserIds={typing}
      />
    </div>
  );
}
