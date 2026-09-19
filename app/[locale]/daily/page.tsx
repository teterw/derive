import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { and, asc, eq } from "drizzle-orm";
import { CalendarDays, Flame } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { attempts, runs } from "@/lib/db/schema";
import { allRules } from "@/content/rules";
import { skills } from "@/content/topics";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { DIFFICULTY_LABELS } from "@/content/types";
import {
  findOrCreateDailyRun,
  getDailyStreak,
} from "@/lib/daily/challenge";
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
 * โจทย์ประจำวัน. The same five questions for everyone, every day, built from
 * generators that already exist - "new problems dropped" without new problems
 * (docs/CONTENT-PIPELINE.md §6).
 */
export default async function DailyPage({
  params,
}: PageProps<"/[locale]/daily">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("daily");
  const tExam = await getTranslations("exam");
  const active = locale as Locale;

  const day = bangkokDay();
  const { id: runId } = await findOrCreateDailyRun(user.id, day);
  const streak = await getDailyStreak(user.id);

  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.id, runId), eq(runs.userId, user.id)))
    .limit(1);
  if (!run) notFound();

  const config = asExamRunConfig(run.config);
  if (!config) notFound();

  const rows = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.runId, runId), eq(attempts.userId, user.id)))
    .orderBy(asc(attempts.createdAt));

  const questions = config.refs.map((ref) =>
    generateQuestion(ref.generatorId, ref.seed, ref.difficulty),
  );

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
