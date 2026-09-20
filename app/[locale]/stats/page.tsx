import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Flame, Target, Timer, Trophy } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getTopic, topics } from "@/content/topics";
import { DIFFICULTY_LABELS, type Difficulty } from "@/content/types";
import {
  getAccuracyTrend,
  getDifficultyCounts,
  getHeatmap,
  getPersonalBests,
  getSkillProgress,
  getSpeedByDifficulty,
  getSpeedTrend,
  getStreak,
  getTotals,
  getWeakestSkills,
} from "@/lib/stats/queries";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Heatmap } from "@/components/stats/heatmap";
import { DifficultyRings } from "@/components/stats/difficulty-rings";
import { MasteryBars } from "@/components/stats/mastery-bars";
import { AccuracyTrend, SpeedTrend } from "@/components/stats/trend-charts";

export default async function StatsPage({
  params,
}: PageProps<"/[locale]/stats">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("stats");
  const active = locale as Locale;

  const [
    heatmap,
    streak,
    difficulty,
    accuracy,
    speedByDifficulty,
    speedTrend,
    progress,
    weakest,
    totals,
    bests,
  ] = await Promise.all([
    getHeatmap(user.id),
    getStreak(user.id),
    getDifficultyCounts(user.id),
    getAccuracyTrend(user.id),
    getSpeedByDifficulty(user.id),
    getSpeedTrend(user.id),
    getSkillProgress(user.id),
    getWeakestSkills(user.id),
    getTotals(user.id),
    getPersonalBests(user.id),
  ]);

  const difficultyLabels = Object.fromEntries(
    ([1, 2, 3, 4] as Difficulty[]).map((value) => [
      value,
      DIFFICULTY_LABELS[value][active],
    ]),
  ) as Record<Difficulty, string>;

  const hours = Math.round((totals.timeMs / 3_600_000) * 10) / 10;

  return (
    <AppShell locale={active} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted">
          {t("subtitle", { name: user.displayName })}
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base">{t("activity")}</CardTitle>
            <dl className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-accent" />
                <dt className="text-muted">{t("currentStreak")}</dt>
                <dd className="font-mono tabular-nums">{streak.current}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted" />
                <dt className="text-muted">{t("longestStreak")}</dt>
                <dd className="font-mono tabular-nums">{streak.longest}</dd>
              </div>
            </dl>
          </div>

          <Heatmap
            days={heatmap}
            labels={{
              less: t("less"),
              more: t("more"),
              noPractice: t("noPractice"),
              questions: t("questionsWord"),
              accuracy: t("accuracyWord"),
            }}
            monthNames={t("monthsShort").split(",")}
            weekdayNames={t("weekdaysShort").split(",")}
          />

          <p className="text-xs text-muted">
            {streak.todaySecured
              ? t("todaySecured", { count: streak.todayAttempts })
              : t("todayToGo", {
                  done: streak.todayAttempts,
                  remaining: streak.remaining,
                })}
          </p>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <CardTitle className="text-base">{t("byDifficulty")}</CardTitle>
            <DifficultyRings
              counts={difficulty}
              labels={difficultyLabels}
              solvedLabel={t("solvedWord")}
            />
          </Card>

          <Card className="space-y-4">
            <CardTitle className="text-base">{t("totals")}</CardTitle>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Stat label={t("questionsAnswered")} value={totals.attempts} />
              <Stat label={t("hoursPractised")} value={hours} />
              <Stat label={t("topicsTouched")} value={totals.topics} />
              <Stat label={t("rulesEncountered")} value={totals.rules} />
              <Stat label={t("activeDays")} value={totals.activeDays} />
              <Stat
                label={t("overallAccuracy")}
                value={
                  totals.attempts === 0
                    ? "—"
                    : `${Math.round((totals.correct / totals.attempts) * 100)}%`
                }
              />
            </dl>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <AccuracyTrend
              points={accuracy}
              labels={{
                title: t("accuracyTitle"),
                subtitle: t("accuracySubtitle"),
                accuracy: t("accuracyWord"),
                empty: t("notEnoughData"),
                showTable: t("showTable"),
                hideTable: t("hideTable"),
                day: t("dayWord"),
              }}
            />
          </Card>

          <Card>
            <SpeedTrend
              points={speedTrend}
              labels={{
                title: t("speedTitle"),
                subtitle: t("speedSubtitle"),
                seconds: t("secondsWord"),
                empty: t("notEnoughData"),
                showTable: t("showTable"),
                hideTable: t("hideTable"),
                week: t("weekWord"),
              }}
            />
          </Card>
        </div>

        <Card className="space-y-4">
          <CardTitle className="text-base">{t("speedByDifficulty")}</CardTitle>
          <ul className="grid gap-3 sm:grid-cols-4">
            {speedByDifficulty.map((row) => (
              <li key={row.difficulty} className="space-y-1">
                <p className="text-xs text-muted">
                  {difficultyLabels[row.difficulty]}
                </p>
                <p className="flex items-baseline gap-1">
                  <Timer className="h-3.5 w-3.5 text-muted" />
                  <span className="text-xl">
                    {row.medianSec === null
                      ? "—"
                      : `${Math.round(row.medianSec)}s`}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  {t("fromAttempts", { count: row.attempts })}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        {weakest.length > 0 ? (
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <CardTitle className="text-base">{t("weakest")}</CardTitle>
            </div>
            <MasteryBars
              progress={weakest}
              locale={active}
              levelLabels={t("levels").split(",")}
              notEnoughLabel={t("notEnoughAttempts")}
              drillLabel={t("drill")}
            />
            <Link
              href={`/practice/run?skills=${weakest
                .map((row) => row.skillId)
                .join(",")}&difficulty=1,2,3,4`}
              className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg hover:opacity-90"
            >
              {t("drillAllWeak")}
            </Link>
          </Card>
        ) : null}

        {/*
          By chapter, not as one list.

          `getSkillProgress` returns every skill on purpose, so that "not
          started" is visible rather than missing - and that is still right.
          What changed is the length: at 33 skills a flat list was readable,
          at 78 it is seventy-eight rows in curriculum order, most of them a
          dash, and the eight you have actually practised are somewhere in the
          middle of it. The chapter headings put them back in reach without
          hiding anything, and the count beside each says at a glance where
          there is nothing yet.
        */}
        <Card className="space-y-6">
          <CardTitle className="text-base">{t("perSkill")}</CardTitle>
          {topics.map((topic) => {
            const rows = progress.filter((row) => row.topicId === topic.id);
            if (rows.length === 0) return null;
            const started = rows.filter((row) => row.attempts > 0).length;

            return (
              <section key={topic.id} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1">
                  <h3 className="text-sm font-medium">
                    {topic.name[active]}
                  </h3>
                  <span className="font-mono text-xs tabular-nums text-muted">
                    {started}/{rows.length}
                  </span>
                </div>
                <MasteryBars
                  progress={rows}
                  locale={active}
                  levelLabels={t("levels").split(",")}
                  notEnoughLabel={t("notEnoughAttempts")}
                  drillLabel={t("drill")}
                  showTopic={false}
                />
              </section>
            );
          })}
        </Card>

        <Card className="space-y-4">
          <CardTitle className="text-base">{t("personalBests")}</CardTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">{t("longestCorrectStreak")}</dt>
              <dd className="font-mono tabular-nums">
                {bests.longestCorrectStreak}
              </dd>
            </div>
            {bests.fastestSprints.map((sprint) => (
              <div
                key={sprint.topicId}
                className="flex items-center justify-between gap-3"
              >
                <dt className="text-muted">
                  {t("fastestSprint", {
                    topic: safeTopicName(sprint.topicId, active),
                  })}
                </dt>
                <dd className="font-mono tabular-nums">
                  {Math.round(sprint.ms / 1000)}s
                </dd>
              </div>
            ))}
            {bests.fastestSprints.length === 0 ? (
              <p className="text-xs text-muted">{t("noSprintsYet")}</p>
            ) : null}
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-xl">{value}</dd>
    </div>
  );
}

function safeTopicName(topicId: string, locale: Locale): string {
  try {
    return getTopic(topicId).name[locale];
  } catch {
    return topicId;
  }
}
