import { useEffect } from "react";
import { useChatStore } from "@/stores/chat-store";

/**
 * Simulates other users typing in a channel on a loop, so the typing
 * indicator feels alive without a backend.
 */
export function useSimulatedTyping(channelId: string, candidateIds: string[]) {
  const setTyping = useChatStore((s) => s.setTyping);

  useEffect(() => {
    if (!candidateIds.length) return;
    let active = true;

    const cycle = () => {
      if (!active) return;
      // Randomly pick 0–2 users to "type".
      const count = Math.floor(Math.random() * 3);
      const shuffled = [...candidateIds].sort(() => Math.random() - 0.5);
      setTyping(channelId, shuffled.slice(0, count));
      const next = 2500 + Math.random() * 3500;
      timer = window.setTimeout(cycle, next);
    };

    let timer = window.setTimeout(cycle, 2000);
    return () => {
      active = false;
      window.clearTimeout(timer);
      setTyping(channelId, []);
    };
  }, [channelId, candidateIds, setTyping]);
}
