"use client";

import { useState } from "react";
import type { HeatmapDay } from "@/lib/stats/queries";
import { cn } from "@/lib/utils";

/**
 * The activity heatmap - the emotional centre of the app (PROMPT.md §8).
 *
 * A CSS grid rather than a chart library: 365 rounded squares, five intensity
 * buckets on one gold hue, with an empty day drawn as a recessive surface cell
 * rather than the palest step of the ramp, so "nothing" reads as nothing.
 */

const BUCKET_CLASS = [
  "bg-viz-empty",
  "bg-viz-1",
  "bg-viz-2",
  "bg-viz-3",
  "bg-viz-4",
] as const;

/** Buckets are fixed counts, not quantiles: the scale must not move under you. */
export function bucketOf(attempts: number): 0 | 1 | 2 | 3 | 4 {
  if (attempts <= 0) return 0;
  if (attempts < 10) return 1;
  if (attempts < 25) return 2;
  if (attempts < 50) return 3;
  return 4;
}

export function Heatmap({
  days,
  labels,
  monthNames,
  weekdayNames,
}: {
  days: HeatmapDay[];
  labels: {
    less: string;
    more: string;
    noPractice: string;
    questions: string;
    accuracy: string;
  };
  monthNames: string[];
  weekdayNames: string[];
}) {
  const [hovered, setHovered] = useState<HeatmapDay | null>(null);

  // Pad the start so every column is a full week beginning on Monday.
  const first = days[0];
  const leading = first ? (new Date(`${first.day}T00:00:00Z`).getUTCDay() + 6) % 7 : 0;
  const cells: (HeatmapDay | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...days,
  ];

  const columns: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));

  return (
    <figure className="space-y-3">
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-2">
          <ol
            className="grid shrink-0 gap-[3px] pt-[18px] text-[10px] text-muted"
            aria-hidden
          >
            {weekdayNames.map((name, index) => (
              <li key={name} className="h-[11px] leading-[11px]">
                {index % 2 === 1 ? name : ""}
              </li>
            ))}
          </ol>

          <div>
            <div className="flex gap-[3px] text-[10px] text-muted" aria-hidden>
              {columns.map((column, index) => {
                const label = monthLabel(column, columns[index - 1], monthNames);
                return (
                  <span key={index} className="w-[11px] shrink-0">
                    {label}
                  </span>
                );
              })}
            </div>

            <div className="flex gap-[3px]">
              {columns.map((column, index) => (
                <div key={index} className="grid gap-[3px]">
                  {column.map((cell, row) =>
                    cell ? (
                      <button
                        key={cell.day}
                        type="button"
                        onMouseEnter={() => setHovered(cell)}
                        onFocus={() => setHovered(cell)}
                        onMouseLeave={() => setHovered(null)}
                        onBlur={() => setHovered(null)}
                        title={describe(cell, labels)}
                        aria-label={describe(cell, labels)}
                        className={cn(
                          "h-[11px] w-[11px] cursor-pointer rounded-[2px]",
                          BUCKET_CLASS[bucketOf(cell.attempts)],
                          hovered?.day === cell.day &&
                            "outline-2 outline-offset-1 outline-accent",
                        )}
                      />
                    ) : (
                      <span
                        key={`pad-${index}-${row}`}
                        className="h-[11px] w-[11px]"
                      />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span aria-live="polite" className="min-h-4">
          {hovered ? describe(hovered, labels) : ""}
        </span>
        <span className="flex items-center gap-1.5">
          {labels.less}
          {BUCKET_CLASS.map((className) => (
            <span
              key={className}
              className={cn("h-[11px] w-[11px] rounded-[2px]", className)}
            />
          ))}
          {labels.more}
        </span>
      </figcaption>
    </figure>
  );
}

function describe(
  day: HeatmapDay,
  labels: {
    noPractice: string;
    questions: string;
    accuracy: string;
  },
): string {
  if (day.attempts === 0) return `${day.day} · ${labels.noPractice}`;
  const accuracy = Math.round((day.correct / day.attempts) * 100);
  return `${day.day} · ${day.attempts} ${labels.questions} · ${accuracy}% ${labels.accuracy}`;
}

/** A month name sits above the first column that starts that month. */
function monthLabel(
  column: (HeatmapDay | null)[],
  previous: (HeatmapDay | null)[] | undefined,
  monthNames: string[],
): string {
  const day = column.find(Boolean);
  if (!day) return "";
  const month = Number(day.day.slice(5, 7)) - 1;
  const previousDay = previous?.find(Boolean);
  if (!previousDay) return monthNames[month] ?? "";
  const previousMonth = Number(previousDay.day.slice(5, 7)) - 1;
  return month === previousMonth ? "" : (monthNames[month] ?? "");
}
