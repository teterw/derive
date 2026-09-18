import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { skillsOfTopic, topics } from "@/content/topics";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { MathText } from "@/components/math/math-text";

export default async function LearnIndexPage({
  params,
}: PageProps<"/[locale]/learn">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("learn");
  const active = locale as Locale;

  return (
    <AppShell locale={active} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
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

            <ol className="divide-y divide-border">
              {skillsOfTopic(topic.id).map((skill, index) => (
                <li key={skill.id}>
                  <Link
                    href={`/learn/${skill.id}`}
                    className="group flex items-start gap-3 py-3"
                  >
                    <span className="mt-0.5 font-mono text-xs text-muted tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium group-hover:text-accent">
                        {skill.name[active]}
                      </span>
                      <span className="block text-sm text-muted">
                        <MathText text={skill.summary[active]} />
                      </span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted group-hover:text-accent" />
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
