import { FileText, Film, Music } from "lucide-react";
import type { Attachment } from "@/types";
import { useUIStore } from "@/stores/ui-store";
import { formatBytes } from "@/lib/utils";

export function AttachmentView({ attachment }: { attachment: Attachment }) {
  const setImagePreview = useUIStore((s) => s.setImagePreview);

  if (attachment.type === "image") {
    return (
      <button
        onClick={() =>
          setImagePreview({ url: attachment.url, name: attachment.name })
        }
        className="block max-w-md overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          loading="lazy"
          className="h-auto w-full object-cover"
          style={
            attachment.width && attachment.height
              ? { aspectRatio: `${attachment.width}/${attachment.height}` }
              : undefined
          }
        />
      </button>
    );
  }

  if (attachment.type === "gif") {
    return (
      <div
        className="flex h-40 w-64 items-end overflow-hidden rounded-lg"
        style={{ background: attachment.url }}
      >
        <span className="bg-gradient-to-t from-black/60 to-transparent p-2 text-sm font-semibold text-white">
          {attachment.name}
        </span>
      </div>
    );
  }

  const Icon =
    attachment.type === "video"
      ? Film
      : attachment.type === "audio"
      ? Music
      : FileText;

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex max-w-sm items-center gap-3 rounded-lg border border-border bg-elevated p-3 transition-colors hover:border-brand/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand/15 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand">
          {attachment.name}
        </p>
        {attachment.size && (
          <p className="text-xs text-muted-foreground">
            {formatBytes(attachment.size)}
          </p>
        )}
      </div>
    </a>
  );
}
