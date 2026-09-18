import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { and, asc, eq } from "drizzle-orm";
import { routing, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { attempts, runs } from "@/lib/db/schema";
import { allRules } from "@/content/rules";
import { skills } from "@/content/topics";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { DIFFICULTY_LABELS } from "@/content/types";
import { asExamRunConfig } from "@/lib/exam/session";
import { bangkokStamp } from "@/lib/stats/day";
import { AppShell } from "@/components/layout/app-shell";
import { ToolDock } from "@/components/tools/tool-dock";
import { ExamRunner } from "./exam-runner";
import { ExamResults } from "./exam-results";

const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);
const skillNames = Object.fromEntries(
  skills.map((skill) => [skill.id, skill.name]),
);

/**
 * One URL for an exam: it runs here, and when it is finished the same URL is
 * the results screen. Refreshing never starts a second run.
 */
export default async function ExamRunPage({
  params,
}: PageProps<"/[locale]/exam/[runId]">) {
  const { locale, runId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("exam");
  const active = locale as Locale;

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

  if (run.finishedAt) {
    return (
      <AppShell locale={active} user={user}>
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
            score: t("score"),
            time: t("time"),
            accuracy: t("accuracy"),
            perSkill: t("perSkill"),
            everyQuestion: t("everyQuestion"),
            yourAnswer: t("yourAnswer"),
            theAnswerIs: t("theAnswerIs"),
            notAnswered: t("notAnswered"),
            correct: t("correct"),
            incorrect: t("incorrect"),
            reviewWrong: t("reviewWrong"),
            backToSetup: t("backToSetup"),
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
      <ExamRunner
        runId={runId}
        questions={questions.map(toPublicQuestion)}
        initialAnswered={answered}
        initialExplainMode={config.explainMode}
        timeLimitSec={config.timeLimitSec}
        elapsedSec={Math.floor((Date.now() - run.startedAt.getTime()) / 1000)}
        skillNames={skillNames}
        ruleNames={ruleNames}
        difficultyLabels={DIFFICULTY_LABELS}
      />
      {/* A graph during a closed-book exam would be a different exam. */}
      <ToolDock
        rules={allRules}
        desmosApiKey={process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? ""}
        allowGraph={config.explainMode !== "off"}
      />
    </AppShell>
  );
}
