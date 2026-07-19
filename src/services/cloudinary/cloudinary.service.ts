/**
 * CloudinaryService — media uploads via Cloudinary.
 *
 * Uses the native fetch API against Cloudinary's unsigned upload endpoint (no
 * SDK, no secret in the client — only the public cloud name and upload preset
 * from env). Handles avatars, banners, image/video attachments and voice clips.
 *
 * Credentials are read lazily from `env.cloudinary` at call time, never
 * hardcoded: the feature simply starts working once `VITE_CLOUDINARY_CLOUD_NAME`
 * and `VITE_CLOUDINARY_UPLOAD_PRESET` are filled in. A missing value throws a
 * clear, user-friendly error through the standard `Result` failure shape rather
 * than firing a doomed request.
 */
import type { Result } from "@/types/service";
import { run } from "@/services/service-utils";
import { env } from "@/config/env";
import { AppError } from "@/utils/errors";
import { validateUpload } from "@/validators";
import { UPLOAD } from "@/constants";

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

/** Cloudinary REST resource type per media kind. */
const RESOURCE_TYPE: Record<MediaKind, "image" | "video" | "raw" | "auto"> = {
  avatar: "image",
  banner: "image",
  image: "image",
  video: "video",
  audio: "video", // Cloudinary handles audio under the "video" resource type
};

/** Folder each kind is uploaded into, keeping the media library tidy. */
const FOLDER: Record<MediaKind, string> = {
  avatar: "kg-chatting/avatars",
  banner: "kg-chatting/banners",
  image: "kg-chatting/images",
  video: "kg-chatting/videos",
  audio: "kg-chatting/audio",
};

/** Maps a media kind to the validator ruleset that guards it. */
const VALIDATION_KIND: Record<MediaKind, keyof typeof UPLOAD> = {
  avatar: "avatar",
  banner: "banner",
  image: "image",
  video: "video",
  audio: "audio",
};

export const cloudinaryService = {
  /**
   * Upload a file to Cloudinary via the unsigned preset. `kind` selects the
   * client-side validation rules, resource type and target folder.
   */
  upload(file: File, kind: MediaKind): Promise<Result<CloudinaryUploadResult>> {
    return run(async () => {
      // 1. Client-side guard (size + MIME) — the same bounds Storage rules use.
      const check = validateUpload(file, VALIDATION_KIND[kind]);
      if (!check.ok) {
        throw new AppError("invalid-input", check.message);
      }

      // 2. Resolve credentials lazily; a clear error if config is missing.
      let cloudName: string;
      let uploadPreset: string;
      try {
        cloudName = env.cloudinary.cloudName;
        uploadPreset = env.cloudinary.uploadPreset;
      } catch (cause) {
        throw new AppError(
          "unavailable",
          "Media uploads aren't configured yet. Please try again later.",
          { cause }
        );
      }

      const resourceType = RESOURCE_TYPE[kind];
      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", uploadPreset);
      form.append("folder", FOLDER[kind]);

      // 3. Fire the unsigned upload.
      let response: Response;
      try {
        response = await fetch(endpoint, { method: "POST", body: form });
      } catch (cause) {
        // Network-level failure (offline, DNS, CORS) — retryable.
        throw new AppError(
          "network",
          "We couldn't reach the upload service. Check your connection and try again.",
          { cause }
        );
      }

      if (!response.ok) {
        const detail = await safeErrorMessage(response);
        const code = response.status === 401 || response.status === 403
          ? "permission-denied"
          : response.status >= 500
            ? "unavailable"
            : "unknown";
        throw new AppError(code, detail ?? "The upload failed. Please try again.");
      }

      const data = (await response.json()) as CloudinaryRawResult;
      return {
        url: data.url,
        secureUrl: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
        format: data.format,
        resourceType: data.resource_type,
      };
    });
  },
} as const;

/** Shape of the fields we read from Cloudinary's upload response. */
interface CloudinaryRawResult {
  url: string;
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  bytes: number;
  format: string;
  resource_type: string;
}

/** Best-effort extraction of Cloudinary's error message; never throws. */
async function safeErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body?.error?.message ?? null;
  } catch {
    return null;
  }
}
