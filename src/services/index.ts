/**
 * Barrel export for the service layer.
 *
 * Stores import services from here. No React component should import a service
 * directly — the layering is UI → Store → Service → Firebase.
 */
export { authService } from "./auth/auth.service";
export type { Credentials, RegistrationData } from "./auth/auth.service";

export { userService } from "./users/user.service";
export { friendService } from "./friends/friend.service";
export { presenceService } from "./presence/presence.service";
export { dmService } from "./dm/dm.service";
export { serverService } from "./servers/server.service";
export { channelService } from "./channels/channel.service";
export { notificationService } from "./notifications/notification.service";
export { searchService } from "./search/search.service";
export { settingsService } from "./settings/settings.service";
export { storageService } from "./storage/storage.service";
export { cloudinaryService } from "./cloudinary/cloudinary.service";
export type { MediaKind, CloudinaryUploadResult } from "./cloudinary/cloudinary.service";
