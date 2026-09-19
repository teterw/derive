"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { levelFromXp } from "@/lib/stats/level";
import type { XpPartKey } from "@/lib/stats/constants";
import { useXpState } from "./xp-context";
import { cn } from "@/lib/utils";

/**
 * The level on the header avatar, and the award that drops out of it.
 *
 * It goes here because this is where the learner already is. A second card in
 * the body of the page put two faces on one screen saying the same thing, and
 * the award has further to travel from the middle of a page than from the
 * corner it belongs in.
 *
 * The number is recomputed from lifetime XP by the same function the profile
 * uses, so the header and the profile can never disagree.
 */
export function HeaderXp() {
  const state = useXpState();
  const t = useTranslations("profile");
  const tXp = useTranslations("xp");

  /*
   * The award is rendered from context and only *retired* by state, so nothing
   * is copied from one into the other - a copy can disagree with what it was
   * copied from. The id expires, not the contents: two identical awards in a
   * row are two events and the second must still show.
   */
  const [expired, setExpired] = useState<number | null>(null);
  const award = state?.award ?? null;

  useEffect(() => {
    if (!award) return;
    const timer = setTimeout(() => setExpired(award.id), 2600);
    return () => clearTimeout(timer);
  }, [award]);

  // Hooks first: a page outside the provider still has to run the same ones.
  if (!state) return null;

  const progress = levelFromXp(state.totalXp);
  const shown = award && award.id !== expired ? award : null;

  return (
    <div className="relative flex items-center">
      <span
        className="rounded-full bg-accent px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold leading-none text-accent-fg tabular-nums"
        title={t("level", { level: progress.level })}
      >
        {progress.level}
      </span>

      {/*
        The bar is under the badge and the avatar beside it, tying the two
        together without adding a row to a header that is already tight on a
        phone.
      */}
      <span
        className="absolute inset-x-0 -bottom-1.5 h-0.5 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={progress.into}
        aria-valuemin={0}
        aria-valuemax={progress.span}
        aria-label={t("level", { level: progress.level })}
      >
        <span
          className="block h-full bg-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${Math.round(progress.fraction * 100)}%` }}
        />
      </span>

      {/*
        Hangs below the header, out of the flow, anchored right so it cannot
        push the page around or run off the edge of a phone. `pointer-events:
        none` because it passes over the theme and logout buttons on its way.
      */}
      <div
        className="pointer-events-none absolute right-0 top-full z-30 mt-3 w-40"
        aria-live="polite"
      >
        {shown ? (
          <div
            key={shown.id}
            className={cn(
              "xp-award rounded-lg border border-border bg-surface px-3 py-2 shadow-lg",
            )}
          >
            <p className="text-right font-mono text-lg font-semibold leading-none text-accent tabular-nums">
              +{shown.total}
            </p>
            <dl className="mt-1.5 space-y-0.5 text-[0.7rem]">
              {shown.parts.map((part) => (
                <div key={part.key} className="flex items-baseline gap-2">
                  <dt className="flex-1 text-right text-muted">
                    {tXp(part.key as XpPartKey)}
                  </dt>
                  <dd className="w-7 text-left font-mono text-accent tabular-nums">
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
