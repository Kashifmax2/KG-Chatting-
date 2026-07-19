import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { emojiCategories, emojis, frequentEmojis } from "@/data/pickers";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? emojis.filter(
          (e) => e.name.includes(q) || e.char === q
        )
      : emojis;
    return emojiCategories
      .map((cat) => ({
        category: cat,
        items: filtered.filter((e) => e.category === cat),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <div className="flex h-96 w-80 flex-col">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji"
            className="h-9 pl-8"
          />
        </div>
      </div>

      {!query && (
        <div className="px-3 pb-2">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Frequently Used
          </p>
          <div className="flex flex-wrap gap-0.5">
            {frequentEmojis.map((char) => (
              <EmojiButton key={char} char={char} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3">
        {grouped.map((group) => (
          <div key={group.category} className="mb-3">
            <p className="sticky top-0 bg-popover py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {group.category}
            </p>
            <div className="flex flex-wrap gap-0.5">
              {group.items.map((e) => (
                <EmojiButton key={e.id} char={e.char} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No emoji found
          </p>
        )}
      </ScrollArea>
    </div>
  );
}

function EmojiButton({
  char,
  onSelect,
}: {
  char: string;
  onSelect: (c: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(char)}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md text-xl transition-transform hover:scale-125 hover:bg-accent"
      )}
    >
      {char}
    </button>
  );
}
