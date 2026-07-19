import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import type { Channel } from "@/types";
import { getUser } from "@/data/users";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VoiceChannelView({ channel }: { channel: Channel }) {
  const connected = channel.connectedUserIds ?? [];
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [video, setVideo] = useState(false);

  const participants = joined ? connected : connected;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-[#000000]/40">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <Volume2 className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-bold">{channel.name}</h1>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        {participants.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <Volume2 className="mx-auto mb-3 h-12 w-12 opacity-40" />
            <p className="text-lg font-semibold text-foreground">
              No one's here yet
            </p>
            <p>Join the channel to start the conversation.</p>
          </div>
        ) : (
          <div className="grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-3">
            {participants.map((uid) => {
              const user = getUser(uid);
              if (!user) return null;
              return (
                <motion.div
                  key={uid}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative flex aspect-video flex-col items-center justify-center rounded-xl bg-elevated ring-2 ring-transparent transition-all hover:ring-online"
                >
                  <UserAvatar user={user} size="xl" />
                  <span className="mt-3 rounded-md bg-black/40 px-2 py-0.5 text-sm font-semibold">
                    {user.displayName}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Control tray */}
      <div className="flex items-center justify-center gap-3 pb-8">
        <Button
          size="icon"
          variant={muted ? "destructive" : "secondary"}
          className="h-12 w-12 rounded-full"
          onClick={() => setMuted((m) => !m)}
        >
          {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          variant={video ? "default" : "secondary"}
          className="h-12 w-12 rounded-full"
          onClick={() => setVideo((v) => !v)}
        >
          {video ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full"
        >
          <MonitorUp className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          className={cn(
            "rounded-full px-6",
            joined
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-online text-white hover:bg-online/90"
          )}
          onClick={() => setJoined((j) => !j)}
        >
          {joined ? (
            <>
              <PhoneOff className="h-5 w-5" />
              Disconnect
            </>
          ) : (
            "Join Voice"
          )}
        </Button>
      </div>
    </div>
  );
}
