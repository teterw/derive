import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { and, asc, eq } from "drizzle-orm";
import { CalendarDays, Flame } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { attempts, runs } from "@/lib/db/schema";
import { allRules } from "@/content/rules";
import { skills } from "@/content/topics";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { DIFFICULTY_LABELS } from "@/content/types";
import {
  findDailyRun,
  findOrCreateDailyRun,
  getDailyStreak,
  isDailyBand,
} from "@/lib/daily/challenge";
import { getPassedSkillIds } from "@/lib/learn/progress";
import { asExamRunConfig } from "@/lib/exam/session";
import { bangkokDay, bangkokStamp } from "@/lib/stats/day";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ToolDock } from "@/components/tools/tool-dock";
import { ExamRunner } from "../exam/[runId]/exam-runner";
import { ExamResults } from "../exam/[runId]/exam-results";

const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);
const skillNames = Object.fromEntries(
  skills.map((skill) => [skill.id, skill.name]),
);

/**
 * โจทย์ประจำวัน. Five questions a day, built from generators that already
 * exist - "new problems dropped" without new problems
 * (docs/CONTENT-PIPELINE.md §6).
 *
 * They used to be the same five for everyone in the country. They are now drawn
 * from the lessons this learner has passed, which is worth the loss: a daily
 * challenge that asks about things you have not been taught is not a challenge,
 * it is a wall. It is still fixed for the day, so it cannot be rerolled.
 */
export default async function DailyPage({
  params,
  searchParams,
}: PageProps<"/[locale]/daily">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("daily");
  const tExam = await getTranslations("exam");
  const active = locale as Locale;

  const day = bangkokDay();

  /*
   * Four round trips, run one after another, only two of which depended on
   * anything before them. The streak does not need the run, and once the run
   * id is known its row and its attempts can be fetched together - so this is
   * two waves rather than four queues, against a database in another country.
   */
  const query = await searchParams;
  const wanted = Array.isArray(query.band) ? query.band[0] : query.band;

  /*
   * The run is not created just by looking at the page any more - an unstarted
   * day is where the band is chosen, and creating it to render it would make
   * that choice for them. It is started by picking one.
   */
  const [started, streak, passedSkillIds] = await Promise.all([
    findDailyRun(user.id, day),
    getDailyStreak(user.id),
    getPassedSkillIds(user.id),
  ]);

  const header = (
    <header className="mb-6 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Flame className="h-4 w-4 text-accent" />
          <span className="text-muted">{t("streak")}</span>
          <span className="font-mono tabular-nums">{streak.current}</span>
        </div>
      </div>
      <p className="text-sm text-muted">{t("subtitle", { day })}</p>
    </header>
  );

  /*
   * Not started yet: choose how hard today is. Plain links rather than a form,
   * so the choice is an ordinary navigation that works with JavaScript off and
   * can be read straight off the URL.
   */
  if (!started && !isDailyBand(wanted)) {
    return (
      <AppShell locale={active} user={user}>
        {header}
        <Card className="space-y-4">
          <div className="space-y-1">
            <CardTitle className="text-base">{t("chooseBand")}</CardTitle>
            <CardDescription>
              {passedSkillIds.length > 0
                ? t("fromPassed", { count: passedSkillIds.length })
                : t("fromEverything")}
            </CardDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(["easy", "normal", "hard"] as const).map((band) => (
              <Link
                key={band}
                href={`/daily?band=${band}`}
                className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3 transition-colors hover:border-accent hover:bg-accent/5"
              >
                <span className="font-medium">{t(`band.${band}`)}</span>
                <span className="text-xs text-muted">{t(`bandNote.${band}`)}</span>
              </Link>
            ))}
          </div>

          <p className="text-xs text-muted">{t("bandOncePerDay")}</p>
        </Card>
      </AppShell>
    );
  }

  const { id: runId } = await findOrCreateDailyRun(user.id, day, {
    skillIds: passedSkillIds,
    band: isDailyBand(wanted) ? wanted : undefined,
  });

  const [[run], rows] = await Promise.all([
    db
      .select()
      .from(runs)
      .where(and(eq(runs.id, runId), eq(runs.userId, user.id)))
      .limit(1),
    db
      .select()
      .from(attempts)
      .where(and(eq(attempts.runId, runId), eq(attempts.userId, user.id)))
      .orderBy(asc(attempts.createdAt)),
  ]);

  if (!run) notFound();

  const config = asExamRunConfig(run.config);
  if (!config) notFound();

  const questions = config.refs.map((ref) =>
    generateQuestion(ref.generatorId, ref.seed, ref.difficulty),
  );

  if (run.finishedAt) {
    return (
      <AppShell locale={active} user={user}>
        {header}
        <Card className="mb-6 space-y-1">
          <CardTitle className="text-base">{t("doneTitle")}</CardTitle>
          <CardDescription>{t("doneBody")}</CardDescription>
        </Card>
        <ExamResults
          locale={active}
          run={{
            total: run.total,
            correct: run.correct,
            durationMs: run.durationMs,
            startedAtLabel: bangkokStamp(run.startedAt),
          }}
          questions={questions}
          attempts={rows.map((row) => ({
            questionId: `${row.generatorId}:${row.seed}:${row.difficulty}`,
            userAnswer: row.userAnswer ?? "",
            isCorrect: row.isCorrect,
            timeMs: row.timeMs,
            skillId: row.skillId,
          }))}
          ruleNames={ruleNames}
          skillNames={skillNames}
          difficultyLabels={DIFFICULTY_LABELS}
          labels={{
            title: t("resultsTitle"),
            score: tExam("score"),
            time: tExam("time"),
            accuracy: tExam("accuracy"),
            perSkill: tExam("perSkill"),
            everyQuestion: tExam("everyQuestion"),
            yourAnswer: tExam("yourAnswer"),
            theAnswerIs: tExam("theAnswerIs"),
            notAnswered: tExam("notAnswered"),
            correct: tExam("correct"),
            incorrect: tExam("incorrect"),
            reviewWrong: tExam("reviewWrong"),
            backToSetup: t("backHome"),
          }}
        />
      </AppShell>
    );
  }

  const answered: Record<string, { answer: string; correct: boolean }> = {};
  for (const row of rows) {
    answered[`${row.generatorId}:${row.seed}:${row.difficulty}`] = {
      answer: row.userAnswer ?? "",
      correct: row.isCorrect,
    };
  }

  return (
    <AppShell locale={active} user={user}>
      {header}
      <ExamRunner
        runId={runId}
        questions={questions.map(toPublicQuestion)}
        initialAnswered={answered}
        initialExplainMode={config.explainMode}
        timeLimitSec={0}
        elapsedSec={0}
        mode="daily"
        skillNames={skillNames}
        ruleNames={ruleNames}
        difficultyLabels={DIFFICULTY_LABELS}
      />
      <ToolDock
        rules={allRules}
        desmosApiKey={process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? ""}
      />
    </AppShell>
  );
}
