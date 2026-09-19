import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { Link } from "@/i18n/navigation";
import { allRules } from "@/content/rules";
import { getSkill, skills } from "@/content/topics";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { DIFFICULTY_LABELS } from "@/content/types";
import { normalizeConfig, planQuestions } from "@/lib/practice/session";
import { LESSON_TEST_LENGTH } from "@/lib/learn/progress";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PracticeRunner } from "../../../practice/practice-runner";

const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);
const skillNames = Object.fromEntries(
  skills.map((skill) => [skill.id, skill.name]),
);

/**
 * One lesson's test: a fixed number of questions on that skill alone, which
 * ticks the lesson off when enough of them are right.
 *
 * It is the same runner as practice, with `assess` set. A test is not a
 * different way of answering a question - it is the same questions with a line
 * drawn under them - and having two runners would mean two places for the
 * marking, the keyboard handling and the maths field to drift apart.
 *
 * The seed is fresh on every visit rather than taken from the URL, so a failed
 * test cannot be retaken with the questions already known. That is the one
 * place where practice's "same run survives a reload" rule is wrong.
 */
export default async function LessonTestPage({
  params,
}: PageProps<"/[locale]/learn/[skillId]/test">) {
  const { locale, skillId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("learn");
  const tNav = await getTranslations("nav");
  const active = locale as Locale;

  let skill;
  try {
    skill = getSkill(skillId);
  } catch {
    notFound();
  }

  const config = normalizeConfig({
    skillIds: [skill.id],
    // The whole range this lesson has content for: a test that only ever asked
    // the easy ones would tick a box that did not mean anything.
    difficulties: [1, 2, 3, 4],
  });

  let questions;
  try {
    questions = planQuestions(config, LESSON_TEST_LENGTH).map((ref) =>
      toPublicQuestion(
        generateQuestion(ref.generatorId, ref.seed, ref.difficulty),
      ),
    );
  } catch {
    return (
      <AppShell
        locale={active}
        user={user}
        back={{ href: `/learn/${skill.id}`, label: tNav("backToLesson") }}
      >
        <Card className="space-y-2">
          <CardTitle>{t("noTestTitle")}</CardTitle>
          <CardDescription>{t("noTestBody")}</CardDescription>
          <Link
            href={`/learn/${skill.id}`}
            className="text-sm text-accent hover:underline"
          >
            {tNav("backToLesson")}
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      locale={active}
      user={user}
      back={{ href: `/learn/${skill.id}`, label: tNav("backToLesson") }}
    >
      <PracticeRunner
        config={config}
        first={questions[0]!}
        queue={questions}
        assess={{ skillId: skill.id }}
        ruleNames={ruleNames}
        skillNames={skillNames}
        difficultyLabels={DIFFICULTY_LABELS}
      />
    </AppShell>
  );
}
