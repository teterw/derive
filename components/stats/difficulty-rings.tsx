import type { DifficultyCount } from "@/lib/stats/queries";
import type { Difficulty } from "@/content/types";

/**
 * LeetCode-style rings: one per difficulty, showing how many were answered
 * correctly out of how many were asked.
 *
 * Difficulty is an *ordered* category, so the four rings use the ordinal ramp
 * rather than four unrelated hues - and each ring carries its own label, so
 * colour is never the only thing telling them apart.
 */
const RING_COLOR: Record<Difficulty, string> = {
  1: "var(--viz-1)",
  2: "var(--viz-2)",
  3: "var(--viz-3)",
  4: "var(--viz-4)",
};

const SIZE = 84;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DifficultyRings({
  counts,
  labels,
  solvedLabel,
}: {
  counts: DifficultyCount[];
  labels: Record<Difficulty, string>;
  solvedLabel: string;
}) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {counts.map((count) => {
        const share = count.attempts === 0 ? 0 : count.correct / count.attempts;
        const dash = CIRCUMFERENCE * share;

        return (
          <li
            key={count.difficulty}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative">
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="img"
                aria-label={`${labels[count.difficulty]}: ${count.correct} / ${count.attempts} ${solvedLabel}`}
              >
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke="var(--surface-2)"
                  strokeWidth={STROKE}
                />
                {share > 0 ? (
                  <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={RING_COLOR[count.difficulty]}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                    transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  />
                ) : null}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold leading-none">
                  {count.correct}
                </span>
                <span className="text-xs text-muted">/{count.attempts}</span>
              </div>
            </div>
            <span className="text-center text-xs text-muted">
              {labels[count.difficulty]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
