import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SkillProgress } from "@/lib/stats/queries";
import { getSkill, getTopic } from "@/content/topics";
import { MASTERY_MIN_ATTEMPTS } from "@/lib/stats/constants";
import { cn } from "@/lib/utils";

/**
 * Per-skill mastery. Skills are a nominal list, so every bar is the same
 * colour and length carries the value - a darker-where-bigger ramp would burn
 * the colour channel on information the bar already shows.
 *
 * The level (ยังไม่เริ่ม / กำลังเรียน / ชำนาญ / แม่นยำ) rides alongside as a
 * word, because a level is a judgement and should be said, not implied.
 */
export function MasteryBars({
  progress,
  locale,
  levelLabels,
  notEnoughLabel,
  drillLabel,
  showTopic = true,
}: {
  progress: SkillProgress[];
  locale: Locale;
  levelLabels: string[];
  notEnoughLabel: string;
  drillLabel: string;
  /**
   * The chapter name beside each skill. Wanted when the list cuts across
   * chapters, as the weakest-five does; noise when the list is already under
   * a chapter heading.
   */
  showTopic?: boolean;
}) {
  return (
    <ul className="space-y-3">
      {progress.map((row) => {
        const skill = safeSkill(row.skillId);
        const enough = row.attempts >= MASTERY_MIN_ATTEMPTS;
        const percent = Math.round(row.ema * 100);

        return (
          <li key={row.skillId} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="min-w-0">
                <span className="text-sm">
                  {skill ? skill.name[locale] : row.skillId}
                </span>
                {skill && showTopic ? (
                  <span className="ml-2 text-xs text-muted">
                    {getTopic(skill.topicId).name[locale]}
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-3 text-xs">
                <span
                  className={cn(
                    "text-muted",
                    enough && row.level >= 3 && "text-correct",
                  )}
                >
                  {enough ? levelLabels[row.level] : notEnoughLabel}
                </span>
                <span className="font-mono tabular-nums text-muted">
                  {row.attempts > 0 ? `${row.correct}/${row.attempts}` : "—"}
                </span>
                <Link
                  href={`/practice/run?skills=${row.skillId}&difficulty=1,2,3,4`}
                  className="text-accent hover:underline"
                >
                  {drillLabel}
                </Link>
              </span>
            </div>

            <div
              className="h-2 overflow-hidden rounded-full bg-surface-2"
              role="img"
              aria-label={`${skill ? skill.name[locale] : row.skillId}: ${
                enough ? `${percent}%` : notEnoughLabel
              }`}
            >
              {enough ? (
                <div
                  className="h-full rounded-full bg-viz-3"
                  style={{ width: `${Math.max(2, percent)}%` }}
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function safeSkill(skillId: string) {
  try {
    return getSkill(skillId);
  } catch {
    return null;
  }
}
