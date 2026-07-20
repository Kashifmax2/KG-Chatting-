/**
 * DMStore — the runtime source of truth for direct-message channels (Phase 06
 * scope: open-or-create + navigation).
 *
 * The app still ships mock DM *content* (`src/data/dms.ts`) and mock user
 * profiles (`src/data/users.ts`), but those seeds are frozen module singletons
 * and can't grow. This store clones them on init and owns the mutable channel
 * list plus a participant-profile cache, so the "Message" action can open an
 * existing 1:1 DM or create a new one and immediately navigate to it — for both
 * mock users and real Firebase friends whose profiles are handed in at create
 * time.
 *
 * The full Firestore-backed DM system (persistence, real-time) lands in Phase
 * 08; this keeps the friends flow functional in the meantime.
 */
import { create } from "zustand";
import type { DMChannel, User } from "@/types";
import { dmChannels } from "@/data/dms";
import { users, CURRENT_USER_ID } from "@/data/users";

interface DMState {
  /** All DM channels, seeded from mock data and grown at runtime. */
  channels: DMChannel[];
  /** uid → profile cache for anyone who appears in a DM. */
  users: Record<string, User>;

  /** Look up a channel by id. */
  getChannel: (id: string) => DMChannel | undefined;
  /** Resolve a participant profile (cache-only). */
  resolveUser: (id: string) => User | undefined;
  /**
   * Open the existing 1:1 DM with `user`, or create one. Caches the user's
   * profile so the conversation renders. Returns the channel id to navigate to.
   */
  openOrCreateDM: (user: User) => string;
}

let dmCounter = 0;
const newDMId = () => `dm_local_${Date.now()}_${dmCounter++}`;

export const useDMStore = create<DMState>((set, get) => ({
  // Clone the frozen seeds so the list is mutable.
  channels: dmChannels.map((c) => ({ ...c })),
  users: Object.fromEntries(users.map((u) => [u.id, u])),

  getChannel: (id) => get().channels.find((c) => c.id === id),
  resolveUser: (id) => get().users[id],

  openOrCreateDM: (user) => {
    const { channels, users: cache } = get();
    const existing = channels.find(
      (c) =>
        !c.isGroup &&
        c.participantIds.includes(user.id) &&
        c.participantIds.includes(CURRENT_USER_ID)
    );

    if (existing) {
      // Make sure the participant is resolvable even for an older seeded DM.
      if (!cache[user.id]) set({ users: { ...cache, [user.id]: user } });
      return existing.id;
    }

    const channel: DMChannel = {
      id: newDMId(),
      participantIds: [CURRENT_USER_ID, user.id],
      isGroup: false,
      lastMessageAt: new Date().toISOString(),
    };
    set({
      channels: [channel, ...channels],
      users: { ...cache, [user.id]: user },
    });
    return channel.id;
  },
}));
