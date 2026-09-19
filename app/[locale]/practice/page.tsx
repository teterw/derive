import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { skillsOfTopic, topics } from "@/content/topics";
import { DIFFICULTY_LABELS, DIFFICULTIES } from "@/content/types";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { Tex } from "@/components/math/katex";
import { SkillGroupToggle } from "./skill-group-toggle";

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
            {/*
              The toggles sit beside the heading on a wide screen and below it
              on a phone. Side by side at 390px they squeezed the Thai topic
              name into a two-line column barely wider than the words
              themselves, which made the heading look broken.
            */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <CardTitle>{topic.name[activeLocale]}</CardTitle>
                <CardDescription>
                  {topic.grade[activeLocale]} · {topic.summary[activeLocale]}
                </CardDescription>
              </div>
              <SkillGroupToggle
                skillIds={skillsOfTopic(topic.id).map((skill) => skill.id)}
              />
            </div>

            {/*
              Formula first, name as the caption, nothing else.

              Choosing what to drill is recognition, not reading - you are
              looking for the thing you got wrong yesterday, and a formula is
              recognised far faster than a Thai skill name. The tile used to
              carry two more lines: a sentence of summary, and "มีระดับ 1, 2,
              3, 4" which said the same thing on all fourteen tiles and so
              said nothing at all. Fourteen four-line tiles made a page you
              had to read, which defeats the formula being there.

              The summary still exists, on the skill's lesson page, where
              someone is actually reading.

              `has-[:checked]:` puts the selected state on the whole tile, so
              a glance down the grid says what is on without reading the
              checkboxes.
            */}
            <div className="grid gap-2 sm:grid-cols-2">
              {skillsOfTopic(topic.id).map((skill) => (
                <label
                  key={skill.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3 transition-colors hover:bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                >
                  <Checkbox
                    name="skills"
                    value={skill.id}
                    defaultChecked
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    {/*
                      `overflow-x-auto` alone gave the taller formulas a
                      *vertical* scrollbar too, which looked like a rendering
                      fault. Pinning the y axis leaves only the sideways
                      scroll a wide formula actually needs.
                    */}
                    <span className="block min-w-0 overflow-x-auto overflow-y-hidden text-base leading-snug sm:text-lg">
                      <Tex tex={skill.formula} />
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {skill.name[activeLocale]}
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

        {/*
          The start button follows you down the page. Fourteen skills and four
          difficulties is a lot to scroll past on a phone, and having to scroll
          back to the bottom to begin is a tax on the commonest action there
          is. `sticky bottom-0` inside the form keeps it reachable without
          taking it out of the document flow, so it never covers the last card.
        */}
        {/*
          `bottom-16` on a phone, not `bottom-0`: the shell puts a fixed tab
          bar along the bottom edge below `sm`, and a bar stuck to 0 sits
          underneath it - the start button was there, and invisible.
        */}
        <div className="sticky bottom-16 -mx-4 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:bottom-0 sm:mx-0 sm:rounded-lg sm:border">
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {t("start")}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
