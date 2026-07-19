import { Hash } from "lucide-react";
import type { Channel } from "@/types";

/** The "start of channel" banner rendered above the first message. */
export function ChannelWelcome({ channel }: { channel: Channel }) {
  return (
    <div className="px-4 pb-2 pt-6">
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-elevated">
        <Hash className="h-9 w-9" />
      </div>
      <h2 className="text-3xl font-black">Welcome to #{channel.name}!</h2>
      <p className="mt-1 text-muted-foreground">
        This is the start of the #{channel.name} channel.
        {channel.topic ? ` ${channel.topic}` : ""}
      </p>
    </div>
  );
}
