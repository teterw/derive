import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getReviewQueue } from "@/lib/review/queue";
import { allRules, publicRules } from "@/content/rules";
import { skills } from "@/content/topics";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { DIFFICULTY_LABELS } from "@/content/types";
import { normalizeConfig } from "@/lib/practice/session";
import { AppShell } from "@/components/layout/app-shell";
import { ToolDock } from "@/components/tools/tool-dock";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PracticeRunner } from "../../practice/practice-runner";

const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);
const skillNames = Object.fromEntries(
  skills.map((skill) => [skill.id, skill.name]),
);

/** How many missed questions one sitting re-drills. */
const BATCH = 15;

export default async function ReviewRunPage({
  params,
  searchParams,
}: PageProps<"/[locale]/review/run">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("review");

  const tNav = await getTranslations("nav");
  const active = locale as Locale;

  const { skills: skillsParam } = await searchParams;
  const only = new Set(
    (Array.isArray(skillsParam) ? skillsParam : [skillsParam ?? ""])
      .flatMap((value) => String(value).split(","))
      .filter(Boolean),
  );

  const queue = (await getReviewQueue(user.id, 200))
    .filter((item) => only.size === 0 || only.has(item.skillId))
    .slice(0, BATCH);

  if (queue.length === 0) {
    return (
      <AppShell
        locale={active}
        user={user}
        back={{ href: "/review", label: tNav("backToReview") }}
      >
        <Card className="space-y-2">
          <CardTitle>{t("emptyTitle")}</CardTitle>
          <CardDescription>{t("emptyBody")}</CardDescription>
          <Link href="/review" className="text-sm text-accent hover:underline">
            {t("backToQueue")}
          </Link>
        </Card>
      </AppShell>
    );
  }

  const questions = queue.map((item) =>
    toPublicQuestion(
      generateQuestion(item.generatorId, item.seed, item.difficulty),
    ),
  );

  return (
    <AppShell
      locale={active}
      user={user}
      back={{ href: "/review", label: tNav("backToReview") }}
    >
      <PracticeRunner
        mode="review"
        config={normalizeConfig({
          skillIds: [...new Set(queue.map((item) => item.skillId))],
          difficulties: [...new Set(queue.map((item) => item.difficulty))],
        })}
        first={questions[0]!}
        queue={questions}
        ruleNames={ruleNames}
        skillNames={skillNames}
        difficultyLabels={DIFFICULTY_LABELS}
      />
      <ToolDock
        rules={publicRules}
        desmosApiKey={process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? ""}
      />
    </AppShell>
  );
}
