import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getSkill, getTopic, hasSkill, skills } from "@/content/topics";
import { getLesson, hasLesson } from "@/content/lessons";
import { allRules, getRule } from "@/content/rules";
import { generateQuestion } from "@/content/generators";
import { DIFFICULTY_LABELS } from "@/content/types";
import { AppShell } from "@/components/layout/app-shell";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Tex } from "@/components/math/katex";
import { MathText } from "@/components/math/math-text";
import { QuestionDisplay } from "@/components/math/question-display";
import { RuleChip, StepViewer } from "@/components/math/step-viewer";

const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);

export function generateStaticParams() {
  return skills.map((skill) => ({ skillId: skill.id }));
}

/**
 * Learn mode: concept, then worked examples revealed step by step, then a few
 * guided questions (PROMPT.md §2, Phase 1).
 *
 * The worked examples are generated from `(generatorId, seed, difficulty)`, so
 * everything on this page has already been through the property gate.
 */
export default async function LessonPage({
  params,
}: PageProps<"/[locale]/learn/[skillId]">) {
  const { locale, skillId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!hasSkill(skillId) || !hasLesson(skillId)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("learn");
  const active = locale as Locale;

  const skill = getSkill(skillId);
  const topic = getTopic(skill.topicId);
  const lesson = getLesson(skillId);

  const examples = lesson.examples.map((example) => ({
    ...example,
    question: generateQuestion(
      example.generatorId,
      example.seed,
      example.difficulty,
    ),
  }));

  const practice = lesson.practice.map((example) =>
    generateQuestion(example.generatorId, example.seed, example.difficulty),
  );

  return (
    <AppShell locale={active} user={user}>
      <article className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-2">
          <Link
            href="/learn"
            className="text-xs text-muted hover:text-fg"
          >
            {topic.name[active]}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {lesson.title[active]}
          </h1>
          <p className="text-muted">
            <MathText text={lesson.intro[active]} />
          </p>
        </header>

        <Card className="space-y-2 border-accent/40 bg-accent/5">
          <CardTitle className="text-sm uppercase tracking-wide text-accent">
            {t("bigIdea")}
          </CardTitle>
          <p>
            <MathText text={lesson.bigIdea[active]} />
          </p>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("rulesUsed")}</h2>
          <div className="space-y-3">
            {lesson.ruleIds.map((ruleId) => {
              const rule = getRule(ruleId);
              return (
                <Card key={ruleId} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <RuleChip ruleId={rule.id} name={rule.name[active]} />
                    {rule.conditions ? (
                      <span className="text-xs text-muted">
                        <MathText text={rule.conditions[active]} />
                      </span>
                    ) : null}
                  </div>
                  <Tex tex={rule.statement} display className="py-1" />
                  <CardDescription>
                    <MathText text={rule.plain[active]} />
                  </CardDescription>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("workedExamples")}</h2>
          {examples.map((example, index) => (
            <Card key={index} className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="accent">
                  {DIFFICULTY_LABELS[example.difficulty][active]}
                </Badge>
                <span className="text-xs text-muted">
                  {t("exampleNumber", { number: index + 1 })}
                </span>
              </div>

              <QuestionDisplay
                prompt={example.question.prompt[active]}
                stem={example.question.stem}
                size="medium"
              />

              {example.note ? (
                <p className="text-sm text-muted">
                  <MathText text={example.note[active]} />
                </p>
              ) : null}

              <StepViewer
                steps={example.question.steps}
                ruleNames={ruleNames}
                startRevealed={1}
              />
            </Card>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-4 w-4 text-wrong" />
            {t("pitfalls")}
          </h2>
          <ul className="space-y-2">
            {lesson.pitfalls.map((pitfall, index) => (
              <li
                key={index}
                className="rounded-md border border-wrong/30 bg-wrong/5 px-3 py-2 text-sm"
              >
                <MathText text={pitfall[active]} />
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("tryThese")}</h2>
          <Card className="space-y-4">
            <ol className="space-y-4">
              {practice.map((question, index) => (
                <li key={index} className="space-y-2">
                  <p className="text-sm text-muted">
                    {index + 1}. <MathText text={question.prompt[active]} />
                  </p>
                  <Tex tex={question.stem} display className="text-lg" />
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted">{t("tryTheseNote")}</p>
          </Card>
          <Link
            href={`/practice/run?skills=${skill.id}&difficulty=1,2`}
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-accent px-6 font-medium text-accent-fg hover:opacity-90"
          >
            {t("practiceThisSkill")}
          </Link>
        </section>
      </article>
    </AppShell>
  );
}
