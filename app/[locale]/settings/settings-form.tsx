"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Shuffle, Upload, X } from "lucide-react";
import { saveProfileAction, type ProfileState } from "@/lib/profile/actions";
import { BIO_MAX, DISPLAY_NAME_MAX } from "@/lib/profile/limits";
import { ACCEPTED_TYPES } from "@/lib/profile/limits";
import { Avatar, avatarSeed, AVATAR_SEEDS } from "@/components/profile/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";

/**
 * Editing your own profile: the picture, the name, a line about yourself, and
 * whether you appear on the board.
 *
 * Two ways to have a picture. Upload one, or cycle through the generated
 * patterns - which is what everyone starts with, so nobody is ever a grey
 * silhouette and nobody is pushed into uploading a photo of themselves to look
 * like a real member.
 *
 * The form is `multipart/form-data` by virtue of carrying a file input, and
 * the file is validated and re-encoded on the server; nothing the browser says
 * about it is trusted. See `lib/profile/avatar-upload.ts`.
 */
export function SettingsForm({
  locale,
  username,
  initial,
}: {
  locale: string;
  username: string;
  initial: {
    displayName: string;
    bio: string;
    avatarSlot: number;
    /** The saved picture, if there is one. */
    avatarUrl: string | null;
    hideFromLeaderboard: boolean;
  };
}) {
  const t = useTranslations("settings");
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    saveProfileAction,
    null,
  );

  const [slot, setSlot] = useState(initial.avatarSlot);
  const [bio, setBio] = useState(initial.bio);

  const fileRef = useRef<HTMLInputElement>(null);
  /** An object URL for the file just chosen, shown before anything is saved. */
  const [preview, setPreview] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  /*
   * An object URL holds the file in memory until it is revoked, so each new
   * choice releases the previous one and unmounting releases the last.
   */
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setRemoving(false);
  }

  function clearPicture() {
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
    // Only a *saved* picture needs the server told to delete it.
    setRemoving(Boolean(initial.avatarUrl));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="avatarSlot" value={slot} />

      {/*
        Three states: an uploaded picture, a picture just chosen but not yet
        saved, and the generated pattern. The preview shows the file the moment
        it is picked rather than after saving, because choosing the wrong photo
        and finding out on the next page is a bad way to learn.
      */}
      <div className="flex items-center gap-4">
        <Avatar
          seed={avatarSeed(username, slot)}
          src={preview ?? (removing ? null : initial.avatarUrl)}
          size={80}
          className="h-20 w-20"
        />

        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {t("uploadPicture")}
            </Button>

            {preview || (initial.avatarUrl && !removing) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearPicture}
              >
                <X className="h-4 w-4" />
                {t("removePicture")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSlot((current) => (current + 1) % AVATAR_SEEDS)}
              >
                <Shuffle className="h-4 w-4" />
                {t("nextAvatar")}
              </Button>
            )}
          </div>

          <p className="text-xs text-muted">
            {preview || (initial.avatarUrl && !removing)
              ? t("pictureNote")
              : t("avatarNote", { count: AVATAR_SEEDS })}
          </p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        name="avatar"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={onPick}
      />
      <input
        type="hidden"
        name="removeAvatar"
        value={removing ? "on" : "off"}
      />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("displayName")}</span>
        <input
          name="displayName"
          defaultValue={initial.displayName}
          maxLength={DISPLAY_NAME_MAX}
          required
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-fg"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="flex items-baseline justify-between">
          <span className="text-sm font-medium">{t("bio")}</span>
          <span className="font-mono text-xs tabular-nums text-muted">
            {bio.length}/{BIO_MAX}
          </span>
        </span>
        <textarea
          name="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value.slice(0, BIO_MAX))}
          maxLength={BIO_MAX}
          rows={3}
          placeholder={t("bioPlaceholder")}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-3">
        <Checkbox
          name="hideFromLeaderboard"
          defaultChecked={initial.hideFromLeaderboard}
          className="mt-0.5 shrink-0"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{t("hideMe")}</span>
          <span className="block text-xs text-muted">{t("hideMeNote")}</span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
        {state?.saved ? (
          <span className="flex items-center gap-1.5 text-sm text-correct">
            <Check className="h-4 w-4" />
            {t("saved")}
          </span>
        ) : null}
        {state?.error ? (
          <span className="text-sm text-wrong">{t(`error.${state.error}`)}</span>
        ) : null}
      </div>
    </form>
  );
}
