import React from "react";
import { getUser } from "@/data/users";

/**
 * Lightweight message formatter. Supports a useful subset of Discord markdown:
 * fenced code blocks, inline code, bold, italics, strikethrough, links, and
 * @mentions. Kept dependency-free and deterministic so it renders the mock
 * content faithfully.
 */
export function MessageContent({ content }: { content: string }) {
  const blocks = content.split(/(```[\s\S]*?```)/g).filter(Boolean);

  return (
    <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground/95">
      {blocks.map((block, i) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const inner = block.slice(3, -3).replace(/^\w*\n/, "");
          return (
            <pre
              key={i}
              className="my-1 overflow-x-auto rounded-md border border-border bg-rail p-3 font-mono text-sm text-foreground/90"
            >
              <code>{inner}</code>
            </pre>
          );
        }
        return <InlineText key={i} text={block} />;
      })}
    </div>
  );
}

function InlineText({ text }: { text: string }) {
  // Tokenize inline patterns. Order matters: code first to avoid formatting inside it.
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(~~[^~]+~~)|(https?:\/\/[^\s]+)|(@\w+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];

    if (token.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-rail px-1.5 py-0.5 font-mono text-[13px] text-foreground/90"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-bold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*")) {
      parts.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("~~")) {
      parts.push(
        <span key={key++} className="line-through opacity-80">
          {token.slice(2, -2)}
        </span>
      );
    } else if (token.startsWith("http")) {
      parts.push(
        <a
          key={key++}
          href={token}
          target="_blank"
          rel="noreferrer"
          className="text-brand hover:underline"
        >
          {token}
        </a>
      );
    } else if (token.startsWith("@")) {
      const uname = token.slice(1);
      const user = [...usersByUsername()].find(([u]) => u === uname)?.[1];
      parts.push(
        <span
          key={key++}
          className="rounded bg-brand/25 px-1 font-medium text-brand-foreground/90 text-brand"
        >
          @{user?.displayName ?? uname}
        </span>
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}

// Small memo so mention lookups don't rebuild every render.
let cache: Map<string, ReturnType<typeof getUser>> | null = null;
function usersByUsername() {
  if (cache) return cache;
  cache = new Map();
  // Known usernames from the mock set; resolved lazily.
  const names = ["kgmax", "aria", "leon", "maya", "theo", "nina", "sam", "ivy", "zane", "kgbot"];
  const ids = ["u_kg", "u_aria", "u_leo", "u_maya", "u_theo", "u_nina", "u_sam", "u_ivy", "u_zane", "u_bot"];
  names.forEach((n, i) => cache!.set(n, getUser(ids[i])));
  // Also map by display-ish handle "KG"
  cache.set("KG", getUser("u_kg"));
  return cache;
}
