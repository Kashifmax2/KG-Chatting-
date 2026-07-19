import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Compass, Search, Users } from "lucide-react";
import {
  exploreCategories,
  exploreServers,
  type ExploreServer,
} from "@/data/explore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

const compact = (n: number) =>
  Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export default function ExplorePage() {
  const [category, setCategory] = useState<string>("Featured");
  const [query, setQuery] = useState("");
  const [joined, setJoined] = useState<Set<string>>(new Set());

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exploreServers.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      const matchesCategory =
        query.length > 0
          ? true
          : category === "Featured"
          ? s.featured
          : s.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, query]);

  const toggleJoin = (id: string) =>
    setJoined((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-chat">
      <ScrollArea className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand via-indigo-500 to-fuchsia-600 px-8 py-14 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Compass className="mx-auto mb-3 h-10 w-10" />
            <h1 className="text-4xl font-black">Find your community</h1>
            <p className="mx-auto mt-2 max-w-lg text-white/85">
              From gaming to study groups, there's a place for you on KG
              Chatting.
            </p>
          </motion.div>
          <div className="relative mx-auto mt-6 max-w-md">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Explore communities"
              className="h-12 bg-white pl-10 text-foreground"
            />
          </div>
        </div>

        <div className="mx-auto max-w-6xl p-6">
          {/* Category chips */}
          {!query && (
            <div className="mb-6 flex flex-wrap gap-2">
              {exploreCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                    category === c
                      ? "bg-brand text-white"
                      : "bg-elevated text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {results.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No communities found"
              description="Try a different search or category."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((server) => (
                <ExploreCard
                  key={server.id}
                  server={server}
                  joined={joined.has(server.id)}
                  onToggle={() => toggleJoin(server.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ExploreCard({
  server,
  joined,
  onToggle,
}: {
  server: ExploreServer;
  joined: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="relative h-24" style={{ background: server.banner }}>
        <div className="absolute -bottom-5 left-4 flex h-12 w-12 items-center justify-center rounded-xl bg-elevated text-2xl shadow-lg ring-4 ring-card">
          {server.icon}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-7">
        <h3 className="font-bold">{server.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">
          {server.description}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-online" />
            {compact(server.online)} Online
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {compact(server.members)} Members
          </span>
        </div>
        <Button
          onClick={onToggle}
          variant={joined ? "secondary" : "default"}
          className="mt-4 w-full"
        >
          {joined ? (
            <>
              <Check className="h-4 w-4" />
              Joined
            </>
          ) : (
            "Join Server"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
