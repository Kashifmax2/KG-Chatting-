import { useEffect, useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  AtSign,
  Bell,
  Phone,
  Pin,
  Users,
  Video,
} from "lucide-react";
import { getDMChannel } from "@/data/dms";
import { getUser, CURRENT_USER_ID } from "@/data/users";
import { useChatStore, EMPTY_TYPING } from "@/stores/chat-store";
import { useSimulatedTyping } from "@/hooks/use-simulated-typing";
import { useUIStore } from "@/stores/ui-store";
import { HomeSidebar } from "@/components/layout/home-sidebar";
import { MessageList } from "@/components/chat/message-list";
import { Composer } from "@/components/chat/composer";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProfilePopupCard } from "@/components/shared/profile-popup";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { statusMeta } from "@/components/shared/status-dot";

export default function DMPage() {
  const { dmId } = useParams();
  const dm = dmId ? getDMChannel(dmId) : undefined;

  const ensureChannel = useChatStore((s) => s.ensureChannel);
  const messages = useChatStore((s) => (dmId ? s.messages[dmId] : undefined));
  const typing = useChatStore((s) =>
    dmId ? s.typing[dmId] ?? EMPTY_TYPING : EMPTY_TYPING
  );
  const memberListOpen = useUIStore((s) => s.memberListOpen);
  const toggleMemberList = useUIStore((s) => s.toggleMemberList);

  useEffect(() => {
    if (dmId) ensureChannel(dmId, true);
  }, [dmId, ensureChannel]);

  const otherId = dm?.participantIds.find((id) => id !== CURRENT_USER_ID);
  const typingCandidates = useMemo(
    () => (otherId ? [otherId] : []),
    [otherId]
  );
  useSimulatedTyping(dmId ?? "", typingCandidates);

  if (!dm) return <Navigate to="/friends" replace />;

  const other = getUser(otherId ?? "");
  const title = dm.isGroup ? dm.name ?? "Group" : other?.displayName ?? "Unknown";

  return (
    <div className="flex h-full min-w-0 flex-1">
      <HomeSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-chat">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            {dm.isGroup ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                <Users className="h-3.5 w-3.5" />
              </div>
            ) : other ? (
              <UserAvatar
                user={other}
                size="sm"
                showStatus
                ringClassName="border-chat"
                className="h-6 w-6"
              />
            ) : null}
            <h1 className="truncate font-bold">{title}</h1>
            {!dm.isGroup && other && (
              <span className="hidden text-xs text-muted-foreground md:inline">
                {statusMeta[other.status].label}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <IconBtn label="Start Voice Call" icon={Phone} />
            <IconBtn label="Start Video Call" icon={Video} />
            <IconBtn label="Pinned Messages" icon={Pin} />
            <IconBtn label="Add Friends to DM" icon={AtSign} />
            <IconBtn
              label="Toggle Profile"
              icon={Users}
              onClick={toggleMemberList}
            />
            <IconBtn label="Notification Settings" icon={Bell} />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <MessageList
              channelId={dm.id}
              messages={messages ?? []}
              header={<DMIntro title={title} isGroup={dm.isGroup} otherId={otherId} />}
            />
            <Composer
              channelId={dm.id}
              placeholder={`Message ${dm.isGroup ? title : "@" + title}`}
              typingUserIds={typing}
            />
          </div>

          {/* Profile side panel for 1:1 DMs */}
          {memberListOpen && !dm.isGroup && other && (
            <aside className="hidden w-80 border-l border-border bg-sidebar p-4 xl:block">
              <ProfilePopupCard user={other} compact className="w-full shadow-none" />
            </aside>
          )}

          {memberListOpen && dm.isGroup && (
            <aside className="hidden w-60 border-l border-border bg-sidebar xl:block">
              <ScrollArea className="h-full p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Members — {dm.participantIds.length}
                </p>
                <div className="space-y-0.5">
                  {dm.participantIds.map((id) => {
                    const u = getUser(id);
                    if (!u) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/60"
                      >
                        <UserAvatar
                          user={u}
                          size="sm"
                          showStatus
                          ringClassName="border-sidebar"
                        />
                        <span className="truncate text-sm font-medium">
                          {u.displayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Phone;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon-sm" variant="ghost" onClick={onClick}>
          <Icon className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function DMIntro({
  title,
  isGroup,
  otherId,
}: {
  title: string;
  isGroup: boolean;
  otherId?: string;
}) {
  const other = getUser(otherId ?? "");
  return (
    <div className="px-4 pb-2 pt-6">
      {!isGroup && other ? (
        <UserAvatar user={other} size="xl" className="mb-3" />
      ) : (
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-brand text-white">
          <Users className="h-10 w-10" />
        </div>
      )}
      <h2 className="text-3xl font-black">{title}</h2>
      <p className="mt-1 text-muted-foreground">
        {isGroup
          ? `Welcome to the beginning of the ${title} group.`
          : `This is the beginning of your direct message history with ${title}.`}
      </p>
    </div>
  );
}
