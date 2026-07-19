import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { trendingGifs } from "@/data/pickers";
import type { GifItem } from "@/types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GifPickerProps {
  onSelect: (gif: GifItem) => void;
}

/**
 * GIF picker over the mock GIF set. Since there's no GIF API, results are
 * labeled animated gradient tiles that behave exactly like a real grid.
 */
export function GifPicker({ onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trendingGifs;
    return trendingGifs.filter((g) => g.title.toLowerCase().includes(q));
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
            placeholder="Search Tenor"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 pb-2">
        <p className="px-1 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {query ? "Results" : "Trending"}
        </p>
        <div className="columns-2 gap-2">
          {results.map((gif) => (
            <button
              key={gif.id}
              onClick={() => onSelect(gif)}
              style={{ background: gif.gradient, aspectRatio: `${gif.width}/${gif.height}` }}
              className="group relative mb-2 flex w-full items-end overflow-hidden rounded-lg text-left transition-transform hover:scale-[1.02]"
            >
              <span className="w-full bg-gradient-to-t from-black/60 to-transparent p-2 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {gif.title}
              </span>
            </button>
          ))}
        </div>
        {results.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No GIFs found
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
