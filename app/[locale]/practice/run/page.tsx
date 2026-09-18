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
} from "@/lib/practice/session";
import { AppShell } from "@/components/layout/app-shell";
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
  const config = configFromSearchParams(await searchParams);

  let first;
  try {
    const ref = nextQuestionRef(config);
    first = toPublicQuestion(
      generateQuestion(ref.generatorId, ref.seed, ref.difficulty),
    );
  } catch {
    return (
      <AppShell locale={locale as Locale} user={user}>
        <Card className="space-y-2">
          <CardTitle>{t("noContentTitle")}</CardTitle>
          <CardDescription>{t("noContentBody")}</CardDescription>
          <Link href="/practice" className="text-sm text-accent hover:underline">
            {t("backToSetup")}
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell locale={locale as Locale} user={user}>
      <PracticeRunner
        config={config}
        first={first}
        ruleNames={ruleNames}
        skillNames={skillNames}
        difficultyLabels={DIFFICULTY_LABELS}
      />
    </AppShell>
  );
}
