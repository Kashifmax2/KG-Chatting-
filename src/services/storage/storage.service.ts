/**
 * StorageService — Firebase Storage blobs owned by the app.
 *
 * Used for files that belong in Firebase's own bucket (with Storage security
 * rules) rather than Cloudinary. Phase 03 defines the contract only. Uploads
 * validate size/type client-side before hitting the network.
 */
import type { Result } from "@/types/service";
import { notImplemented } from "@/services/service-utils";

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  contentType: string;
}

export const storageService = {
  /** Upload a file to a storage path. */
  upload(_path: string, _file: File): Promise<Result<UploadResult>> {
    return notImplemented("storageService.upload");
  },

  /** Delete a file at a storage path. */
  remove(_path: string): Promise<Result<void>> {
    return notImplemented("storageService.remove");
  },

  /** Resolve a download URL for a storage path. */
  getUrl(_path: string): Promise<Result<string>> {
    return notImplemented("storageService.getUrl");
  },
} as const;
