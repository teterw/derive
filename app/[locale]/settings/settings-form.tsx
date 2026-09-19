"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Shuffle } from "lucide-react";
import { saveProfileAction, type ProfileState } from "@/lib/profile/actions";
import { BIO_MAX, DISPLAY_NAME_MAX } from "@/lib/profile/limits";
import { Avatar, avatarSeed, AVATAR_SEEDS } from "@/components/profile/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";

/**
 * Editing your own profile: the picture, the name, a line about yourself, and
 * whether you appear on the board.
 *
 * The avatar is chosen by cycling, not by uploading. There is no file to
 * store, serve or moderate, and "mine doesn't look like anyone else's" is
 * most of what an avatar is actually for on a site this size.
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

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="avatarSlot" value={slot} />

      <div className="flex items-center gap-4">
        <Avatar
          seed={avatarSeed(username, slot)}
          size={80}
          className="h-20 w-20"
        />
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSlot((current) => (current + 1) % AVATAR_SEEDS)}
          >
            <Shuffle className="h-4 w-4" />
            {t("nextAvatar")}
          </Button>
          <p className="text-xs text-muted">
            {t("avatarNote", { count: AVATAR_SEEDS })}
          </p>
        </div>
      </div>

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
