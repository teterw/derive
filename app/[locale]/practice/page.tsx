import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { skillsOfTopic, topics } from "@/content/topics";
import { difficultiesForSkill } from "@/content/generators";
import { DIFFICULTY_LABELS, DIFFICULTIES } from "@/content/types";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { MathText } from "@/components/math/math-text";

/**
 * Setup for a practice run. A plain GET form, so it works with JavaScript
 * switched off and the resulting URL is shareable and bookmarkable.
 */
export default async function PracticeSetupPage({
  params,
}: PageProps<"/[locale]/practice">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("practice");
  const activeLocale = locale as Locale;

  return (
    <AppShell locale={activeLocale} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("setupTitle")}</h1>
        <p className="text-sm text-muted">{t("setupSubtitle")}</p>
      </div>

      <form action={`/${locale}/practice/run`} method="get" className="mt-6 space-y-6">
        {topics.map((topic) => (
          <Card key={topic.id} className="space-y-4">
            <div className="space-y-1">
              <CardTitle>{topic.name[activeLocale]}</CardTitle>
              <CardDescription>
                {topic.grade[activeLocale]} · {topic.summary[activeLocale]}
              </CardDescription>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {skillsOfTopic(topic.id).map((skill) => (
                <label
                  key={skill.id}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-3 py-2 hover:bg-surface-2"
                >
                  <Checkbox
                    name="skills"
                    value={skill.id}
                    defaultChecked
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {skill.name[activeLocale]}
                    </span>
                    <span className="block text-xs text-muted">
                      <MathText text={skill.summary[activeLocale]} />
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {t("difficultiesAvailable", {
                        list: difficultiesForSkill(skill.id).join(", "),
                      })}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Card>
        ))}

        <Card className="space-y-4">
          <CardTitle>{t("difficulty")}</CardTitle>
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
                {difficulty} · {DIFFICULTY_LABELS[difficulty][activeLocale]}
              </label>
            ))}
          </div>
        </Card>

        <Button type="submit" size="lg">
          {t("start")}
        </Button>
      </form>
    </AppShell>
  );
}
