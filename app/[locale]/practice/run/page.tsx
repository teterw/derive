import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { Link } from "@/i18n/navigation";
import { allRules } from "@/content/rules";
import { skills } from "@/content/topics";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { DIFFICULTY_LABELS } from "@/content/types";
import {
  configFromSearchParams,
  nextQuestionRef,
  parseQuestionId,
  planQuestions,
} from "@/lib/practice/session";
import { getTotalXp } from "@/lib/profile/queries";
import { avatarSeed, avatarUrl } from "@/components/profile/avatar";
import { AppShell } from "@/components/layout/app-shell";
import { ToolDock } from "@/components/tools/tool-dock";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PracticeRunner } from "../practice-runner";

/** Rule and skill names, resolved once on the server for the whole run. */
const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);
const skillNames = Object.fromEntries(
  skills.map((skill) => [skill.id, skill.name]),
);

export default async function PracticeRunPage({
  params,
  searchParams,
}: PageProps<"/[locale]/practice/run">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("practice");

  const tNav = await getTranslations("nav");

  const startingXp = await getTotalXp(user.id);
  const query = await searchParams;
  const config = configFromSearchParams(query);

  // `?q=` pins the question, so a language switch does not deal a new one.
  const pinned = typeof query.q === "string" ? parseQuestionId(query.q) : null;

  const render = (ref: {
    generatorId: string;
    seed: number;
    difficulty: 1 | 2 | 3 | 4;
  }) =>
    toPublicQuestion(
      generateQuestion(ref.generatorId, ref.seed, ref.difficulty),
    );

  let first;
  /*
   * A run of a chosen length is dealt here, in full, rather than a question at
   * a time. The plan covers every skill that was ticked before repeating any of
   * them, which random draws do not, and it is fixed by the seed in the URL, so
   * reloading or switching language continues the same run instead of dealing a
   * new one. The runner already knows how to walk a queue - that is how review
   * works - including where it ends.
   *
   * No answers go with it: `toPublicQuestion` strips them, and marking is still
   * done by regenerating the question on the server.
   */
  let queue;
  try {
    if (config.length !== null) {
      queue = planQuestions(config, config.length).map(render);
      first = queue[0]!;
    } else {
      first = render(pinned ?? nextQuestionRef(config));
    }
  } catch {
    return (
      <AppShell
        locale={locale as Locale}
        user={user}
        back={{ href: "/practice", label: tNav("backToPractice") }}
      >
        <Card className="space-y-2">
          <CardTitle>{t("noContentTitle")}</CardTitle>
          <CardDescription>{t("noContentBody")}</CardDescription>
          <Link
            href="/practice"
            className="text-sm text-accent hover:underline"
          >
            {t("backToSetup")}
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      locale={locale as Locale}
      user={user}
      back={{ href: "/practice", label: tNav("backToPractice") }}
    >
      <PracticeRunner
        config={config}
        first={first}
        queue={queue}
        ruleNames={ruleNames}
        skillNames={skillNames}
        difficultyLabels={DIFFICULTY_LABELS}
        startingXp={startingXp}
        learner={{
          username: user.username,
          displayName: user.displayName,
          avatarSeed: avatarSeed(user.username, user.avatarSlot),
          avatarSrc: avatarUrl(user.username, user.avatarUpdatedAt),
        }}
      />
      <ToolDock
        rules={allRules}
        desmosApiKey={process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? ""}
      />
    </AppShell>
  );
}
