"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { levelFromXp } from "@/lib/stats/level";
import type { XpAward, XpPartKey } from "@/lib/stats/constants";
import { Avatar } from "./avatar";
import { cn } from "@/lib/utils";

/**
 * Who you are, what level that makes you, and what the last answer was worth.
 *
 * It is attached to the learner rather than floated in the middle of the page,
 * because that is what the number is about - the level belongs to the person,
 * so it sits on them. The award appears directly beneath, itemised.
 *
 * Itemised is the point. A bare "+8" says something happened; "+2 no hints"
 * says what you did well, and is the only part of this worth reading twice. The
 * parts come from the server with the award, so the breakdown is the actual
 * arithmetic that was applied rather than a plausible-looking reconstruction.
 *
 * Level is recomputed from total XP exactly as the profile does it, so the two
 * can never disagree.
 */
export function XpMeter({
  username,
  displayName,
  avatarSeed,
  avatarSrc,
  totalXp,
  award,
  className,
}: {
  username: string;
  displayName: string;
  avatarSeed: string;
  avatarSrc?: string | null;
  /** Lifetime XP, including everything earned so far this run. */
  totalXp: number;
  /** The most recent award, or null before anything has been answered. */
  award: (XpAward & { id: number }) | null;
  className?: string;
}) {
  const t = useTranslations("profile");
  const tXp = useTranslations("xp");
  const progress = levelFromXp(totalXp);

  /*
   * The award is rendered straight from the prop and only *retired* by state,
   * so nothing is copied from props into state - which is both the lint rule
   * and the reason for it: a copy can disagree with what it was copied from.
   * The id is what expires, not the contents: two identical awards in a row are
   * two events and the second must still show.
   */
  const [expired, setExpired] = useState<number | null>(null);
  useEffect(() => {
    if (!award) return;
    const timer = setTimeout(() => setExpired(award.id), 2600);
    return () => clearTimeout(timer);
  }, [award]);

  const shown = award && award.id !== expired ? award : null;

  /*
   * A level-up, derived rather than stored. The badge is keyed on the level, so
   * passing one replaces the element and the CSS animation runs; the class is
   * applied only above the level this card opened at, so it does not fire on
   * the first render for someone who simply already has a level.
   */
  // `useState` rather than a ref: this is read while rendering, and a ref read
  // during render is not reactive - which is exactly what the lint rule is for.
  const [openedAtLevel] = useState(progress.level);
  const levelledUp = progress.level > openedAtLevel;

  return (
    <div className={cn("relative w-full max-w-[13rem]", className)}>
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
        <Avatar
          seed={avatarSeed}
          src={avatarSrc}
          size={28}
          className="shrink-0"
        />

        <span
          className="min-w-0 flex-1 truncate text-sm font-medium"
          title={displayName}
        >
          {displayName || username}
        </span>

        <span
          key={progress.level}
          className={cn(
            "shrink-0 rounded-full bg-accent px-2 py-0.5 font-mono text-xs font-semibold text-accent-fg tabular-nums",
            levelledUp && "xp-levelup",
          )}
          title={t("level", { level: progress.level })}
        >
          {progress.level}
        </span>
      </div>

      {/*
        Hung off the bottom edge of the card rather than placed under it, so
        the card is the thing with the level on it and the bar is that card
        filling up - which is the shape the whole idea borrows.
      */}
      <div
        className="-mt-px h-1 w-full overflow-hidden rounded-b-lg bg-surface-2"
        role="progressbar"
        aria-valuenow={progress.into}
        aria-valuemin={0}
        aria-valuemax={progress.span}
        aria-label={t("level", { level: progress.level })}
      >
        {/*
          A width transition, not an animation: the bar travels from wherever
          it was to wherever it now is, however many awards land in between.
          An animation would restart from zero on each one.
        */}
        <div
          className="h-full bg-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${Math.round(progress.fraction * 100)}%` }}
        />
      </div>

      {/*
        Out of the flow entirely, hanging below the card.

        It was `position: fixed` at first, which looked right and was not: an
        ancestor with a transform - the page-transition animation - becomes the
        containing block for a fixed child, so the card landed 500px from where
        it was told to. Absolute against this card is the honest version of what
        was meant, and it owes nothing to what any ancestor is doing.

        Out of the flow also means an award appearing cannot push the question
        down the screen mid-run.
      */}
      <div className="absolute inset-x-0 top-full mt-2" aria-live="polite">
        {shown ? (
          <div key={shown.id} className="xp-award">
            <p className="text-center font-mono text-xl font-semibold text-accent tabular-nums">
              +{shown.total}
            </p>
            <dl className="mt-1 space-y-0.5 text-xs">
              {shown.parts.map((part) => (
                <div key={part.key} className="flex items-baseline gap-2">
                  <dt className="flex-1 text-right text-muted">
                    {tXp(part.key as XpPartKey)}
                  </dt>
                  <dd className="w-8 text-left font-mono text-accent tabular-nums">
                    +{part.amount}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}
