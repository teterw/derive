import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { ArrowRight, Check } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { skillsOfTopic, topics } from "@/content/topics";
import { getLessonStates } from "@/lib/learn/progress";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
  const active = locale as Locale;

  const states = await getLessonStates(user.id);
  const total = topics.reduce(
    (sum, topic) => sum + skillsOfTopic(topic.id).length,
    0,
  );
  const done = [...states.values()].filter((state) => state.passed).length;

  return (
    <AppShell locale={active} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        {/*
          The subtitle carries the count now. "How far through am I" is the
          question this page exists to answer, and it was previously a sentence
          of encouragement that answered nothing.
        */}
        <p className="text-sm text-muted">{t("progress", { done, total })}</p>
      </div>

      <div className="mt-6 space-y-6">
        {topics.map((topic) => (
          <Card key={topic.id} className="space-y-4">
            <div className="space-y-1">
              <CardTitle>{topic.name[active]}</CardTitle>
              <CardDescription>
                {topic.grade[active]} · {topic.summary[active]}
              </CardDescription>
            </div>

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
              {skillsOfTopic(topic.id).map((skill) => {
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
                            ? "border-correct bg-correct text-white"
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
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
