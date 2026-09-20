import { notFound } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { getPassedSkillIds } from "@/lib/learn/progress";
import { skillsOfTopic, topics } from "@/content/topics";
import { DIFFICULTY_LABELS, DIFFICULTIES } from "@/content/types";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Chapter } from "@/components/ui/chapter";
import { StageJump } from "@/components/ui/stage-jump";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { ROUND, RUN_LENGTHS } from "@/lib/practice/session";
import { Tex } from "@/components/math/katex";
import { SkillGroupToggle } from "./skill-group-toggle";
import { SelectionCount } from "./selection-count";

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
  const tCommon = await getTranslations("common");
  const activeLocale = locale as Locale;

  /*
   * Nothing starts ticked.
   *
   * This page briefly pre-ticked the lessons you had passed, on the daily
   * challenge's reasoning. Ticking anything at all turned out to be the wrong
   * call: it looks like the app has decided for you, and what it decides is
   * always the chapters you have already finished - exactly the ones you least
   * need to drill. Choosing is the whole job of this page, so it is left to
   * you, and `normalizeConfig` still reads an empty selection as "all of it",
   * which the line under the heading says out loud.
   *
   * The passed count stays, as the figure beside each chapter. It is the same
   * thing `/learn` shows, and it is useful while choosing - it just no longer
   * chooses.
   */
  const passed = new Set(await getPassedSkillIds(user.id));

  return (
    <AppShell locale={activeLocale} user={user}>
      {/*
        A control panel, not a list. `/learn` is a numbered path and `/exam` is
        a cover sheet; this page's job is choosing, so the run's shape is set
        first, the chapters are picked under it, and the bar at the bottom says
        live what has been chosen. Three jobs, three layouts - they used to be
        three copies of the same page and nobody could tell which one they were
        looking at.
      */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <Dumbbell className="size-6 text-accent" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("setupTitle")}
          </h1>
        </div>
        {/*
          Said out loud, because a page of empty boxes with a start button is
          otherwise a page that looks like it will refuse.
        */}
        <p className="text-sm text-muted">{t("setupHint")}</p>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-muted">{tCommon("jumpTo")}</span>
          <StageJump
            labels={{
              lower: tCommon("stage.lower"),
              upper: tCommon("stage.upper"),
              university: tCommon("stage.university"),
            }}
          />
        </div>
      </div>

      <form
        action={`/${locale}/practice/run`}
        method="get"
        className="mt-6 space-y-6"
      >
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
          How long the run is. It used to be endless, which sounds generous and
          is not: nothing ever concludes, so there is no score to have earned
          and no reason to stop at any particular point rather than drifting
          off. A run with an end has both.

          "One of each" is the default because it is the length that matches
          what was ticked above - every lesson asked once, nothing missed - and
          it is the only option whose number depends on the selection, so the
          server works it out rather than the form.
        */}
        <Card className="space-y-4">
          <CardTitle>{t("runLength")}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input
                type="radio"
                name="len"
                value={ROUND}
                defaultChecked
                className="accent-accent"
              />
              {t("lengthRound")}
            </label>
            {RUN_LENGTHS.map((length) => (
              <label
                key={length}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-accent/10"
              >
                <input
                  type="radio"
                  name="len"
                  value={length}
                  className="accent-accent"
                />
                {t("lengthCount", { count: length })}
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input
                type="radio"
                name="len"
                value=""
                className="accent-accent"
              />
              {t("lengthEndless")}
            </label>
          </div>
          <CardDescription>{t("runLengthNote")}</CardDescription>
        </Card>

        {topics.map((topic) => {
          const topicSkills = skillsOfTopic(topic.id);
          const done = topicSkills.filter((skill) =>
            passed.has(skill.id),
          ).length;

          return (
          <Chapter
            key={topic.id}
            id={topic.id}
            title={topic.name[activeLocale]}
            meta={topic.grade[activeLocale]}
            done={done}
            total={topicSkills.length}
          >
            {/*
              The toggles moved inside the panel. In the summary they were a
              button inside a `<summary>`, so clicking either of them would
              also shut the chapter they had just acted on - and they are only
              wanted while it is open anyway.
            */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <CardDescription className="min-w-0">
                {topic.summary[activeLocale]}
              </CardDescription>
              <SkillGroupToggle
                skillIds={topicSkills.map((skill) => skill.id)}
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
              {topicSkills.map((skill) => (
                <label
                  key={skill.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3 transition-colors hover:bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                >
                  <Checkbox
                    name="skills"
                    value={skill.id}
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
          </Chapter>
          );
        })}

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
        <div className="sticky bottom-16 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur sm:bottom-0 sm:mx-0 sm:rounded-lg sm:border">
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            {t("start")}
          </Button>
          <SelectionCount />
        </div>
      </form>
    </AppShell>
  );
}
