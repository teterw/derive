import { Flame } from "lucide-react";
import { Avatar, avatarSeed, avatarUrl } from "./avatar";
import { compactXp } from "@/lib/stats/level";
import type { Profile } from "@/lib/profile/queries";
import { cn } from "@/lib/utils";

/**
 * The card at the top of a profile: who, since when, and how far along.
 *
 * The level number sits *on the bar* rather than above it, because the two are
 * one fact - "level 12, most of the way to 13" - and splitting them into two
 * rows makes the reader assemble it themselves.
 */
export function ProfileCard({
  profile,
  labels,
  className,
}: {
  profile: Profile;
  labels: {
    joined: string;
    streak: string;
    level: string;
  };
  /** Already formatted server-side, in the learner's timezone. */
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <Avatar
          seed={avatarSeed(profile.username, profile.avatarSlot)}
          src={avatarUrl(profile.username, profile.avatarUpdatedAt)}
          size={72}
          className="h-16 w-16 sm:h-20 sm:w-20"
        />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-mono text-2xl leading-tight sm:text-3xl">
            {profile.username}
          </h1>
          <p className="mt-1 text-xs text-muted sm:text-sm">{labels.joined}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted sm:text-sm">
            <Flame
              className={cn(
                "h-3.5 w-3.5",
                profile.currentStreak > 0 ? "text-accent" : "text-muted",
              )}
            />
            {labels.streak}
          </p>
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">{profile.bio}</p>
      ) : null}

      {/*
        The bar is the one piece of pure decoration here and it earns its place:
        a number alone does not say "nearly there", and "nearly there" is the
        whole reason anyone looks at a level.
      */}
      <div className="mt-5 flex items-center gap-3">
        <span
          className="shrink-0 font-mono text-xl tabular-nums sm:text-2xl"
          title={labels.level}
        >
          {profile.level.level}
        </span>

        <div
          className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={profile.level.span}
          aria-valuenow={profile.level.into}
          aria-label={labels.level}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width]"
            style={{ width: `${Math.round(profile.level.fraction * 100)}%` }}
          />
        </div>

        <span className="shrink-0 font-mono text-xs tabular-nums text-muted sm:text-sm">
          {compactXp(profile.level.into)}/{compactXp(profile.level.span)}
        </span>
      </div>
    </div>
  );
}
