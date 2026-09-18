import { notFound } from "next/navigation";
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
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";
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
  const active = locale as Locale;

  const recent = await db
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
    .limit(5);

  return (
    <AppShell locale={active} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("setupTitle")}</h1>
        <p className="text-sm text-muted">{t("setupSubtitle")}</p>
      </div>

      <form action={startExamFormAction} className="mt-6 space-y-6">
        <input type="hidden" name="locale" value={locale} />

        {topics.map((topic) => (
          <Card key={topic.id} className="space-y-4">
            <div className="space-y-1">
              <CardTitle>{topic.name[active]}</CardTitle>
              <CardDescription>{topic.grade[active]}</CardDescription>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {skillsOfTopic(topic.id).map((skill) => (
                <label
                  key={skill.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2"
                >
                  <Checkbox name="skills" value={skill.id} defaultChecked />
                  {skill.name[active]}
                </label>
              ))}
            </div>
          </Card>
        ))}

        <Card className="space-y-5">
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
              <span className="block text-sm font-medium">{t("timeLimit")}</span>
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
