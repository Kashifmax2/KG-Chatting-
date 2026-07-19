import { useRef } from "react";
import { useChatStore } from "@/stores/chat-store";
import { Textarea } from "@/components/ui/textarea";

interface EditComposerProps {
  initialValue: string;
  channelId: string;
  messageId: string;
  onCancel: () => void;
  onSave: () => void;
}

/** Inline editor swapped in when a user edits their own message. */
export function EditComposer({
  initialValue,
  channelId,
  messageId,
  onCancel,
  onSave,
}: EditComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const editMessage = useChatStore((s) => s.editMessage);

  const commit = () => {
    const value = ref.current?.value.trim() ?? "";
    if (value) editMessage(channelId, messageId, value);
    onSave();
  };

  return (
    <div className="mt-1">
      <div className="rounded-lg bg-elevated px-1 py-1">
        <Textarea
          ref={ref}
          defaultValue={initialValue}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              onCancel();
            }
          }}
          className="max-h-40"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        escape to{" "}
        <button onClick={onCancel} className="text-brand hover:underline">
          cancel
        </button>{" "}
        • enter to{" "}
        <button onClick={commit} className="text-brand hover:underline">
          save
        </button>
      </p>
    </div>
  );
}
