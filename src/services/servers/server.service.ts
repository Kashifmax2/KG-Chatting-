/**
 * ServerService — servers (guilds) and their membership.
 *
 * Backed by `servers` and the `server_members` subcollection. Phase 03 defines
 * the contract only. Ownership and role checks are enforced by security rules.
 */
import type { Result, Unsubscribe } from "@/types/service";
import type { ServerDoc, ServerMemberDoc } from "@/types/firestore";
import { notImplemented } from "@/services/service-utils";

export interface CreateServerInput {
  ownerId: string;
  name: string;
  iconUrl?: string;
  template?: string;
}

export const serverService = {
  /** List servers the given user belongs to. */
  listUserServers(_uid: string): Promise<Result<ServerDoc[]>> {
    return notImplemented("serverService.listUserServers");
  },

  /** Fetch a single server by id. */
  getServer(_serverId: string): Promise<Result<ServerDoc | null>> {
    return notImplemented("serverService.getServer");
  },

  /** Create a new server owned by the given user. */
  createServer(_input: CreateServerInput): Promise<Result<ServerDoc>> {
    return notImplemented("serverService.createServer");
  },

  /** Update mutable server fields (name, icon, description). */
  updateServer(_serverId: string, _patch: Partial<ServerDoc>): Promise<Result<void>> {
    return notImplemented("serverService.updateServer");
  },

  /** Delete a server (owner only). */
  deleteServer(_serverId: string): Promise<Result<void>> {
    return notImplemented("serverService.deleteServer");
  },

  /** Join a server via invite. */
  joinServer(_serverId: string, _uid: string): Promise<Result<void>> {
    return notImplemented("serverService.joinServer");
  },

  /** Leave a server. */
  leaveServer(_serverId: string, _uid: string): Promise<Result<void>> {
    return notImplemented("serverService.leaveServer");
  },

  /** List members of a server. */
  listMembers(_serverId: string): Promise<Result<ServerMemberDoc[]>> {
    return notImplemented("serverService.listMembers");
  },

  /** Subscribe to a server document. */
  subscribeToServer(
    _serverId: string,
    _cb: (server: ServerDoc | null) => void
  ): Unsubscribe {
    return notImplemented("serverService.subscribeToServer");
  },
} as const;
