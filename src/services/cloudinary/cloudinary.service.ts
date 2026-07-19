/**
 * CloudinaryService — media uploads via Cloudinary.
 *
 * Uses the native fetch API against Cloudinary's unsigned upload endpoint (no
 * SDK, no secret in the client — only the public cloud name and upload preset
 * from env). Phase 03 defines the contract only. Handles avatars, banners,
 * image/video attachments and voice clips.
 */
import type { Result } from "@/types/service";
import { notImplemented } from "@/services/service-utils";

export type MediaKind = "avatar" | "banner" | "image" | "video" | "audio";

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
  bytes: number;
  format: string;
  resourceType: string;
}

export const cloudinaryService = {
  /**
   * Upload a file to Cloudinary via the unsigned preset. `kind` selects the
   * validation rules and target folder once implemented.
   */
  upload(_file: File, _kind: MediaKind): Promise<Result<CloudinaryUploadResult>> {
    return notImplemented("cloudinaryService.upload");
  },
} as const;
