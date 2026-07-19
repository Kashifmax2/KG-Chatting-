/**
 * EditProfileModal — the full profile editor (Phase 05).
 *
 * Lets the signed-in user edit identity (display name, username, pronouns,
 * custom status), about/bio, appearance (avatar, banner image + colour, accent
 * colour), extra info (country, language, website, social links) and privacy.
 *
 * All writes go through `useProfileStore` (UI → store → service → Firebase).
 * A live `ProfilePopupCard` preview reflects unsaved edits as you type. Avatar
 * and banner uploads open the `ImageCropper` before hitting Cloudinary.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Loader2, Plus, Trash2, X } from "lucide-react";
import type { ProfilePrivacy, PrivacyLevel, SocialLink, User } from "@/types";
import { useProfileStore, type ProfileEditableFields } from "@/stores/profile-store";
import { useCurrentUser } from "@/stores/auth-store";
import { defaultPrivacy } from "@/services/auth/auth-mapper";
import {
  validateBio,
  validateColor,
  validateCustomStatus,
  validateDisplayName,
  validatePronouns,
  validateShortText,
  validateUrl,
} from "@/validators";
import { LIMITS } from "@/constants";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProfilePopupCard } from "@/components/shared/profile-popup";
import { ImageCropper } from "@/components/modals/image-cropper";
import { validateUpload } from "@/validators";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Local form state, seeded from the live user. */
function toForm(user: User): ProfileEditableFields {
  return {
    displayName: user.displayName,
    bio: user.bio ?? "",
    pronouns: user.pronouns ?? "",
    customStatus: user.customStatus ?? "",
    bannerColor: user.bannerColor,
    accentColor: user.accentColor ?? "",
    country: user.country ?? "",
    language: user.language ?? "",
    website: user.website ?? "",
    socialLinks: user.socialLinks ?? [],
    privacy: user.privacy ?? defaultPrivacy(),
  };
}

export function EditProfileModal({ open, onClose }: Props) {
  const user = useCurrentUser();
  const {
    saving,
    uploading,
    error,
    updateProfile,
    changeUsername,
    uploadAvatar,
    uploadBanner,
    removeAvatar,
    removeBanner,
    clearError,
  } = useProfileStore();

  const [form, setForm] = useState<ProfileEditableFields>(() =>
    user ? toForm(user) : ({} as ProfileEditableFields)
  );
  const [username, setUsername] = useState(user?.username ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Cropper state: which target + the picked object URL + original filename.
  const [crop, setCrop] = useState<{
    kind: "avatar" | "banner";
    url: string;
    fileName: string;
  } | null>(null);
  const avatarInput = useRef<HTMLInputElement | null>(null);
  const bannerInput = useRef<HTMLInputElement | null>(null);

  // Re-seed the form whenever the modal opens or the underlying user changes
  // (e.g. after a realtime update lands).
  useEffect(() => {
    if (open && user) {
      setForm(toForm(user));
      setUsername(user.username);
      setFieldError(null);
      clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  // A preview user: the saved user overlaid with the current unsaved edits.
  const previewUser = useMemo<User | null>(() => {
    if (!user) return null;
    return {
      ...user,
      displayName: form.displayName || user.displayName,
      bio: form.bio,
      pronouns: form.pronouns,
      customStatus: form.customStatus,
      bannerColor: form.bannerColor,
      accentColor: form.accentColor,
      website: form.website,
      socialLinks: form.socialLinks,
      username,
    };
  }, [user, form, username]);

  if (!user || !previewUser) return null;

  const set = <K extends keyof ProfileEditableFields>(
    key: K,
    value: ProfileEditableFields[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const setPrivacy = (key: keyof ProfilePrivacy, value: PrivacyLevel) =>
    setForm((f) => ({ ...f, privacy: { ...f.privacy, [key]: value } }));

  /** Validate everything locally before we touch the network. */
  function validateAll(): string | null {
    const checks = [
      validateDisplayName(form.displayName),
      validateBio(form.bio),
      validatePronouns(form.pronouns),
      validateCustomStatus(form.customStatus),
      validateColor(form.bannerColor),
      validateColor(form.accentColor),
      validateUrl(form.website),
      validateShortText(form.country, LIMITS.country.max, "Country"),
      validateShortText(form.language, LIMITS.language.max, "Language"),
    ];
    for (const link of form.socialLinks) {
      checks.push(validateShortText(link.label, LIMITS.socialLabel.max, "Link label"));
      checks.push(validateUrl(link.url));
    }
    const failed = checks.find((c) => !c.ok);
    return failed ? failed.message : null;
  }

  const handleSave = async () => {
    setFieldError(null);
    const invalid = validateAll();
    if (invalid) {
      setFieldError(invalid);
      return;
    }
    // Drop empty social links.
    const socialLinks = form.socialLinks.filter(
      (l) => l.label.trim() && l.url.trim()
    );

    // Username change is a separate, guarded call.
    if (username.trim() !== user.username) {
      const okUser = await changeUsername(username);
      if (!okUser) return; // store sets the error
    }

    const ok = await updateProfile({ ...form, socialLinks });
    if (ok) onClose();
  };

  const pickFile =
    (kind: "avatar" | "banner") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-picking the same file
      if (!file) return;
      const check = validateUpload(file, kind);
      if (!check.ok) {
        setFieldError(check.message);
        return;
      }
      setFieldError(null);
      setCrop({ kind, url: URL.createObjectURL(file), fileName: file.name });
    };

  const handleCropConfirm = async (file: File) => {
    const target = crop;
    if (target) URL.revokeObjectURL(target.url);
    setCrop(null);
    if (!target) return;
    if (target.kind === "avatar") await uploadAvatar(file);
    else await uploadBanner(file);
  };

  const addLink = () =>
    set("socialLinks", [...form.socialLinks, { label: "", url: "" }]);
  const updateLink = (i: number, patch: Partial<SocialLink>) =>
    set(
      "socialLinks",
      form.socialLinks.map((l, idx) => (idx === i ? { ...l, ...patch } : l))
    );
  const removeLink = (i: number) =>
    set("socialLinks", form.socialLinks.filter((_, idx) => idx !== i));

  const busy = saving || uploading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Edit Profile</DialogTitle>

        <div className="grid max-h-[85vh] grid-cols-1 md:grid-cols-[1fr,18rem]">
          {/* Editor */}
          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="p-5">
                {crop ? (
                  <div className="py-4">
                    <p className="mb-4 text-sm font-semibold">
                      {crop.kind === "avatar" ? "Crop avatar" : "Crop banner"}
                    </p>
                    <ImageCropper
                      src={crop.url}
                      shape={crop.kind}
                      fileName={crop.fileName}
                      outputWidth={crop.kind === "avatar" ? 512 : 1024}
                      onCancel={() => {
                        URL.revokeObjectURL(crop.url);
                        setCrop(null);
                      }}
                      onConfirm={handleCropConfirm}
                    />
                  </div>
                ) : (
                  <Tabs defaultValue="identity">
                    <TabsList className="mb-4">
                      <TabsTrigger value="identity">Identity</TabsTrigger>
                      <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="privacy">Privacy</TabsTrigger>
                    </TabsList>

                    {/* IDENTITY */}
                    <TabsContent value="identity" className="space-y-4">
                      <Row label="Display name" hint={`${form.displayName.length}/${LIMITS.displayName.max}`}>
                        <Input
                          value={form.displayName}
                          maxLength={LIMITS.displayName.max}
                          onChange={(e) => set("displayName", e.target.value)}
                        />
                      </Row>
                      <Row
                        label="Username"
                        hint="Changing this is rate-limited"
                      >
                        <Input
                          value={username}
                          maxLength={LIMITS.username.max}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </Row>
                      <Row label="Pronouns">
                        <Input
                          value={form.pronouns}
                          placeholder="e.g. they/them"
                          maxLength={LIMITS.displayName.max}
                          onChange={(e) => set("pronouns", e.target.value)}
                        />
                      </Row>
                      <Row
                        label="Custom status"
                        hint={`${form.customStatus.length}/${LIMITS.customStatus.max}`}
                      >
                        <Input
                          value={form.customStatus}
                          placeholder="What's happening?"
                          maxLength={LIMITS.customStatus.max}
                          onChange={(e) => set("customStatus", e.target.value)}
                        />
                      </Row>
                      <Row
                        label="About me"
                        hint={`${form.bio.length}/${LIMITS.bio.max}`}
                      >
                        <Textarea
                          value={form.bio}
                          rows={4}
                          maxLength={LIMITS.bio.max}
                          className="rounded-md border border-transparent bg-elevated"
                          placeholder="Tell people a little about yourself"
                          onChange={(e) => set("bio", e.target.value)}
                        />
                      </Row>
                    </TabsContent>

                    {/* APPEARANCE */}
                    <TabsContent value="appearance" className="space-y-5">
                      {/* Banner */}
                      <div>
                        <Label className="mb-2 block">Banner</Label>
                        <div
                          className="relative flex h-28 items-end overflow-hidden rounded-lg bg-cover bg-center"
                          style={
                            user.bannerUrl
                              ? { backgroundImage: `url(${user.bannerUrl})` }
                              : { backgroundColor: form.bannerColor }
                          }
                        >
                          <div className="flex w-full items-center justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => bannerInput.current?.click()}
                            >
                              <Camera className="h-4 w-4" />
                              Change
                            </Button>
                            {user.bannerUrl && (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={busy}
                                onClick={() => removeBanner()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <input
                          ref={bannerInput}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={pickFile("banner")}
                        />
                      </div>

                      {/* Avatar */}
                      <div>
                        <Label className="mb-2 block">Avatar</Label>
                        <div className="flex items-center gap-4">
                          <UserAvatar user={previewUser} size="xl" className="h-20 w-20" />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => avatarInput.current?.click()}
                            >
                              <Camera className="h-4 w-4" />
                              Upload
                            </Button>
                            {user.avatarUrl && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-destructive"
                                disabled={busy}
                                onClick={() => removeAvatar()}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        <input
                          ref={avatarInput}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={pickFile("avatar")}
                        />
                      </div>

                      <Separator />

                      <ColorRow
                        label="Banner colour"
                        hint="Shown when no banner image is set"
                        value={form.bannerColor}
                        onChange={(v) => set("bannerColor", v)}
                      />
                      <ColorRow
                        label="Accent colour"
                        value={form.accentColor || "#5865f2"}
                        onChange={(v) => set("accentColor", v)}
                      />
                    </TabsContent>

                    {/* DETAILS */}
                    <TabsContent value="details" className="space-y-4">
                      <Row label="Website">
                        <Input
                          value={form.website}
                          placeholder="https://example.com"
                          inputMode="url"
                          maxLength={LIMITS.url.max}
                          onChange={(e) => set("website", e.target.value)}
                        />
                      </Row>
                      <div className="grid grid-cols-2 gap-3">
                        <Row label="Country">
                          <Input
                            value={form.country}
                            maxLength={LIMITS.country.max}
                            onChange={(e) => set("country", e.target.value)}
                          />
                        </Row>
                        <Row label="Language">
                          <Input
                            value={form.language}
                            maxLength={LIMITS.language.max}
                            onChange={(e) => set("language", e.target.value)}
                          />
                        </Row>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <Label>Social links</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={form.socialLinks.length >= LIMITS.socialLinks.max}
                            onClick={addLink}
                          >
                            <Plus className="h-4 w-4" />
                            Add
                          </Button>
                        </div>
                        {form.socialLinks.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No links yet. Add up to {LIMITS.socialLinks.max}.
                          </p>
                        )}
                        <div className="space-y-2">
                          {form.socialLinks.map((link, i) => (
                            <div key={i} className="flex gap-2">
                              <Input
                                value={link.label}
                                placeholder="Label"
                                maxLength={LIMITS.socialLabel.max}
                                className="w-1/3"
                                onChange={(e) => updateLink(i, { label: e.target.value })}
                              />
                              <Input
                                value={link.url}
                                placeholder="https://…"
                                inputMode="url"
                                maxLength={LIMITS.url.max}
                                onChange={(e) => updateLink(i, { url: e.target.value })}
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label="Remove link"
                                onClick={() => removeLink(i)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* PRIVACY */}
                    <TabsContent value="privacy" className="space-y-4">
                      <PrivacyRow
                        label="Who can see your profile"
                        value={form.privacy.profileVisibility}
                        onChange={(v) => setPrivacy("profileVisibility", v)}
                      />
                      <PrivacyRow
                        label="Who can see your status"
                        value={form.privacy.statusVisibility}
                        onChange={(v) => setPrivacy("statusVisibility", v)}
                      />
                      <PrivacyRow
                        label="Who can see your activity"
                        value={form.privacy.activityVisibility}
                        onChange={(v) => setPrivacy("activityVisibility", v)}
                      />
                      <PrivacyRow
                        label="Who can send friend requests"
                        value={form.privacy.friendRequests}
                        onChange={(v) => setPrivacy("friendRequests", v)}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-border px-5 py-3">
              <AnimatePresence>
                {(fieldError || error) && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 text-sm text-destructive"
                  >
                    {fieldError ?? error}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={busy || Boolean(crop)}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploading ? "Uploading…" : saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="hidden flex-col gap-3 border-l border-border bg-rail p-5 md:flex">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
            <ProfilePopupCard user={previewUser} className="w-full" compact />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ColorRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Row label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={label}
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#5865f2"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded-md border border-border bg-elevated"
        />
        <Input
          value={value}
          placeholder="#5865f2"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Row>
  );
}

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string }[] = [
  { value: "everyone", label: "Everyone" },
  { value: "friends", label: "Friends" },
  { value: "nobody", label: "Nobody" },
];

function PrivacyRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PrivacyLevel;
  onChange: (value: PrivacyLevel) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-rail px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        {PRIVACY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
              value === opt.value
                ? "bg-brand text-brand-foreground"
                : "bg-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
