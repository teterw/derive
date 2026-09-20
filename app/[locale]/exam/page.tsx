import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { and, desc, eq } from "drizzle-orm";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { runs } from "@/lib/db/schema";
import { skillsOfTopic, topics } from "@/content/topics";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/content/types";
import { startExamFormAction } from "@/lib/exam/actions";
import { QUESTION_COUNTS, TIME_LIMITS_MINUTES } from "@/lib/exam/session";
import { bangkokStamp } from "@/lib/stats/day";
import { AppShell } from "@/components/layout/app-shell";
import { Badge, Card, CardTitle } from "@/components/ui/card";
import { Chapter } from "@/components/ui/chapter";
import { StageJump } from "@/components/ui/stage-jump";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";

export default async function ExamSetupPage({
  params,
}: PageProps<"/[locale]/exam">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("exam");
  const tCommon = await getTranslations("common");
  const active = locale as Locale;

  const [recent] = await Promise.all([
    db
      .select({
        id: runs.id,
        startedAt: runs.startedAt,
        finishedAt: runs.finishedAt,
        total: runs.total,
        correct: runs.correct,
      })
      .from(runs)
      // Only exams: a daily challenge is its own thing with its own page.
      .where(and(eq(runs.userId, user.id), eq(runs.mode, "exam")))
      .orderBy(desc(runs.startedAt))
      .limit(5),
  ]);

  /*
   * Nothing starts ticked, for the reason the practice page gives. An exam is
   * something you sit on purpose, over material you choose; the app guessing
   * that for you is worse here than anywhere.
   *
   * Nor is there a progress bar per chapter, which `/learn` and `/practice`
   * both carry: how much of a chapter you have finished is not what you are
   * deciding here, and a paper that shows you your own scores while you set it
   * is inviting you to set an easy one.
   */

  return (
    <AppShell locale={active} user={user}>
      {/*
        A cover sheet, not a list. `/learn` is a numbered path and `/practice`
        is a control panel; an exam is a paper you sit, so this page reads like
        one - the parameters stated at the top in a ruled block, and the
        syllabus under it as a dense two-column checklist rather than a column
        of tall cards. The three pages were indistinguishable before.
      */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <FileText className="size-6 text-accent" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("setupTitle")}
          </h1>
        </div>
        <p className="text-sm text-muted">{t("setupHint")}</p>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-muted">{tCommon("jumpTo")}</span>
          <StageJump
            labels={{
              lower: tCommon("stage.lower"),
              upper: tCommon("stage.upper"),
              university: tCommon("stage.university"),
            }}
          />
        </div>
      </div>

      <form action={startExamFormAction} className="mt-6 space-y-6">
        <input type="hidden" name="locale" value={locale} />

        <Card className="space-y-5 border-t-2 border-t-accent">
          <div className="space-y-2">
            <CardTitle className="text-base">{t("difficultyMix")}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((difficulty) => (
                <label
                  key={difficulty}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2"
                >
                  <Checkbox
                    name="difficulty"
                    value={difficulty}
                    defaultChecked={difficulty <= 2}
                  />
                  {difficulty} · {DIFFICULTY_LABELS[difficulty][active]}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className="block text-sm font-medium">
                {t("questionCount")}
              </span>
              <select
                name="count"
                defaultValue={20}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                {QUESTION_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="block text-sm font-medium">
                {t("timeLimit")}
              </span>
              <select
                name="minutes"
                defaultValue={20}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                {TIME_LIMITS_MINUTES.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes === 0
                      ? t("untimed")
                      : t("minutes", { count: minutes })}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="block text-sm font-medium">
                {t("explainMode")}
              </span>
              <select
                name="explain"
                defaultValue="onWrong"
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="off">{t("explainOff")}</option>
                <option value="onWrong">{t("explainOnWrong")}</option>
                <option value="always">{t("explainAlways")}</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-muted">{t("explainModeNote")}</p>
        </Card>


        {/*
          Two columns of compact cards. The exam's chapters are names only -
          no formulas, unlike the practice page - so they fit side by side, and
          twenty of them become a syllabus you can take in rather than a
          column you scroll. The figure on the right is how many skills the
          chapter would draw from, which is what matters when setting a paper;
          the bar showing how far through you are belongs on `/learn`.
        */}
        <div className="grid gap-3 lg:grid-cols-2">
          {topics.map((topic) => {
            const topicSkills = skillsOfTopic(topic.id);

            return (
              <Chapter
                key={topic.id}
                id={topic.id}
                title={topic.name[active]}
                meta={topic.grade[active]}
                dense
                trailing={
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {topicSkills.length}
                  </span>
                }
              >
                <div className="grid gap-1.5">
                  {topicSkills.map((skill) => (
                    <label
                      key={skill.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-surface-2 has-[:checked]:text-accent"
                    >
                      <Checkbox name="skills" value={skill.id} />
                      {skill.name[active]}
                    </label>
                  ))}
                </div>
              </Chapter>
            );
          })}
        </div>

        <Button type="submit" size="lg">
          {t("start")}
        </Button>
      </form>

      {recent.length > 0 ? (
        <Card className="mt-8 space-y-3">
          <CardTitle className="text-base">{t("recentRuns")}</CardTitle>
          <ul className="divide-y divide-border">
            {recent.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/exam/${run.id}`}
                  className="flex items-center justify-between gap-3 py-2 text-sm hover:text-accent"
                >
                  <span className="text-muted">
                    {bangkokStamp(run.startedAt)}
                  </span>
                  {run.finishedAt ? (
                    <Badge tone="neutral">
                      {run.correct} / {run.total}
                    </Badge>
                  ) : (
                    <Badge tone="accent">{t("inProgress")}</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </AppShell>
  );
}
