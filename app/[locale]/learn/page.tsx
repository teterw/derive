import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { skillsOfTopic, topics } from "@/content/topics";
import { getLessonStates } from "@/lib/learn/progress";
import { AppShell } from "@/components/layout/app-shell";
import { CardDescription } from "@/components/ui/card";
import { Chapter } from "@/components/ui/chapter";
import { StageJump } from "@/components/ui/stage-jump";
import { Tex } from "@/components/math/katex";
import { cn } from "@/lib/utils";

export default async function LearnIndexPage({
  params,
}: PageProps<"/[locale]/learn">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("learn");
  const tCommon = await getTranslations("common");
  const active = locale as Locale;

  const states = await getLessonStates(user.id);
  const total = topics.reduce(
    (sum, topic) => sum + skillsOfTopic(topic.id).length,
    0,
  );
  const done = [...states.values()].filter((state) => state.passed).length;

  /**
   * How far through each chapter the learner is, and therefore which chapters
   * open on arrival.
   *
   * A chapter is open if it is *started but not finished* - that is the work
   * in progress, and carrying on is the commonest reason to be on this page.
   * A finished chapter and one not begun are both closed: neither is where
   * anyone is.
   *
   * If nothing is in progress the first unfinished chapter opens instead, so
   * a learner arriving for the very first time, or returning having just
   * finished one, still lands on something rather than on twenty shut doors.
   */
  const progress = topics.map((topic) => {
    const skills = skillsOfTopic(topic.id);
    const passed = skills.filter(
      (skill) => states.get(skill.id)?.passed,
    ).length;
    return { topic, skills, passed, finished: passed === skills.length };
  });

  const started = progress.filter((row) => row.passed > 0 && !row.finished);
  const openIds = new Set(
    started.length > 0
      ? started.map((row) => row.topic.id)
      : progress
          .filter((row) => !row.finished)
          .slice(0, 1)
          .map((row) => row.topic.id),
  );

  return (
    <AppShell locale={active} user={user}>
      {/*
        Learn, practice and exam were three lists of twenty chapters and became
        impossible to tell apart at a glance - which page am I on? The three
        are doing quite different jobs, so each now looks like the job.
        This one is a *path*: a numbered spine down the left, in curriculum
        order, with the ticks filling in as you go.
      */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="size-6 text-accent" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm text-muted">{t("progress", { done, total })}</p>
          <span
            className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-2"
            aria-hidden
          >
            <span
              className="block h-full rounded-full bg-correct transition-[width] duration-500"
              style={{ width: `${Math.round((done / total) * 100)}%` }}
            />
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      <ol className="mt-6 space-y-3">
        {progress.map(({ topic, skills, passed, finished }, index) => (
          <li key={topic.id} className="relative flex gap-3 sm:gap-4">
            {/*
              The spine. The line runs from under one marker into the gap below
              it, so twenty separate cards read as one continuous route rather
              than as a stack.
            */}
            <div className="relative flex w-8 shrink-0 justify-center pt-4">
              <span
                className={cn(
                  "z-10 grid size-8 shrink-0 place-items-center rounded-full border font-mono text-xs tabular-nums transition-colors",
                  finished
                    ? "border-correct bg-correct text-bg"
                    : passed > 0
                      ? "border-accent bg-surface text-accent"
                      : "border-border bg-surface text-muted",
                )}
              >
                {finished ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  index + 1
                )}
              </span>
              {index < progress.length - 1 ? (
                <span
                  className="absolute inset-x-0 top-12 -bottom-3 mx-auto w-px bg-border"
                  aria-hidden
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
          <Chapter
            id={topic.id}
            title={topic.name[active]}
            meta={topic.grade[active]}
            done={passed}
            total={skills.length}
            open={openIds.has(topic.id)}
          >
            <CardDescription className="mb-2">
              {topic.summary[active]}
            </CardDescription>

            {/*
              Formula first, name under it, tick on the left.

              A lesson is recognised by its formula far faster than by its Thai
              name - the same reason the practice setup page leads with them.
              The summary sentence that used to sit here made every row three
              lines deep, so fourteen lessons were a page you had to read rather
              than scan; it is still on the lesson itself, where someone
              actually is reading.
            */}
            <ol className="divide-y divide-border">
              {skills.map((skill) => {
                const done = states.get(skill.id)?.passed ?? false;
                return (
                  <li key={skill.id}>
                    <Link
                      href={`/learn/${skill.id}`}
                      className="group flex items-center gap-3 py-3"
                    >
                      {/*
                        A box you can see is empty, not just an absent tick:
                        the row of outlines is what makes the list read as a
                        checklist with things left in it.
                      */}
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md border",
                          done
                            ? "border-correct bg-correct text-bg"
                            : "border-border",
                        )}
                        aria-hidden
                      >
                        {done ? <Check className="size-3.5" /> : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block min-w-0 overflow-x-auto overflow-y-hidden text-base leading-snug group-hover:text-accent sm:text-lg">
                          <Tex tex={skill.formula} />
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {skill.name[active]}
                        </span>
                      </span>

                      <span className="sr-only">
                        {done ? t("lessonPassed") : t("lessonNotPassed")}
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-muted group-hover:text-accent" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Chapter>
            </div>
          </li>
        ))}
      </ol>
    </AppShell>
  );
}
