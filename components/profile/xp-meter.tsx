"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { levelFromXp } from "@/lib/stats/level";
import { cn } from "@/lib/utils";

/**
 * The level bar, where the XP is earned.
 *
 * It lives in the runner rather than the header on purpose. XP arrives one
 * answer at a time, and a number that changes somewhere you are not looking has
 * not told you anything - the whole value of showing it is the half-second
 * where you watch it move. So it sits with the question, and the amount flies
 * from the answer to the bar.
 *
 * The level is recomputed from total XP rather than stored, exactly as the
 * profile does it, so the bar here and the bar there can never disagree.
 */
export function XpMeter({
  totalXp,
  className,
}: {
  /** Lifetime XP *including* everything earned so far this run. */
  totalXp: number;
  className?: string;
}) {
  // `profile.level` already reads "เลเวล {level}" - the bar here and the one on
  // the profile should be worded the same, not merely look the same.
  const t = useTranslations("profile");
  const progress = levelFromXp(totalXp);

  /*
   * Each award gets its own element with its own key, so two quick answers
   * animate as two labels rather than one restarting - React reuses a node
   * with the same key and the CSS animation does not replay.
   */
  const [awards, setAwards] = useState<{ id: number; amount: number }[]>([]);
  const previous = useRef(totalXp);
  const nextId = useRef(0);

  useEffect(() => {
    const gained = totalXp - previous.current;
    previous.current = totalXp;
    if (gained <= 0) return;

    const id = nextId.current++;
    setAwards((current) => [...current, { id, amount: gained }]);
    const timer = setTimeout(
      () => setAwards((current) => current.filter((a) => a.id !== id)),
      1100,
    );
    return () => clearTimeout(timer);
  }, [totalXp]);

  /* A level-up is worth marking; it is the only moment the number resets. */
  const [levelledUp, setLevelledUp] = useState(false);
  const previousLevel = useRef(progress.level);
  useEffect(() => {
    if (progress.level <= previousLevel.current) {
      previousLevel.current = progress.level;
      return;
    }
    previousLevel.current = progress.level;
    setLevelledUp(true);
    const timer = setTimeout(() => setLevelledUp(false), 1400);
    return () => clearTimeout(timer);
  }, [progress.level]);

  return (
    <div className={cn("relative mx-auto w-full max-w-xs", className)}>
      <div className="flex items-baseline justify-between text-xs text-muted">
        <span
          className={cn(
            "font-medium transition-colors",
            levelledUp && "text-accent",
          )}
        >
          {t("level", { level: progress.level })}
        </span>
        <span className="font-mono tabular-nums">
          {progress.into} / {progress.span}
        </span>
      </div>

      <div
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={progress.into}
        aria-valuemin={0}
        aria-valuemax={progress.span}
        aria-label={t("level", { level: progress.level })}
      >
        {/*
          Transitioned, not animated: the bar moves from wherever it was to
          wherever it now is, however many awards land in between. An animation
          would restart from zero each time.
        */}
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${Math.round(progress.fraction * 100)}%` }}
        />
      </div>

      {/* Above the bar, out of the flow, so nothing below it shifts. */}
      <div className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center">
        {awards.map((award) => (
          <span
            key={award.id}
            className="xp-award absolute font-mono text-sm font-semibold text-accent"
          >
            +{award.amount}
          </span>
        ))}
      </div>
    </div>
  );
}
