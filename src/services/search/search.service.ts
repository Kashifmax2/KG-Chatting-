/**
 * SearchService — cross-entity search.
 *
 * Backed by the `search_index` collection (denormalised, queryable documents).
 * Phase 03 defines the contract only. Queries are debounced at the call site.
 */
import type { Result } from "@/types/service";
import type { SearchIndexDoc } from "@/types/firestore";
import { notImplemented } from "@/services/service-utils";

export type SearchScope = "all" | "users" | "servers" | "channels" | "messages";

export interface SearchQuery {
  term: string;
  scope?: SearchScope;
  limit?: number;
}

export const searchService = {
  /** Run a search across the index. */
  search(_query: SearchQuery): Promise<Result<SearchIndexDoc[]>> {
    return notImplemented("searchService.search");
  },
} as const;
