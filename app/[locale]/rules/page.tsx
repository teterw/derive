import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { rulesForTopic, searchRules } from "@/content/rules";
import { topics } from "@/content/topics";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Tex } from "@/components/math/katex";
import { MathText } from "@/components/math/math-text";

/**
 * The formula sheet, generated from the same rule registry the step engine
 * uses (PROMPT.md §2, Phase 4) - it lands early because every step chip links
 * into it.
 */
export default async function RulesPage({
  params,
  searchParams,
}: PageProps<"/[locale]/rules">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("rules");
  const active = locale as Locale;

  const { q, topic } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const topicId = typeof topic === "string" ? topic : "";

  const matching = new Set(searchRules(query).map((rule) => rule.id));
  const shown = topics
    .filter((candidate) => !topicId || candidate.id === topicId)
    .map((candidate) => ({
      topic: candidate,
      rules: rulesForTopic(candidate.id).filter((rule) =>
        matching.has(rule.id),
      ),
    }))
    .filter((group) => group.rules.length > 0);

  return (
    <AppShell locale={active} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

      <form
        action={`/${locale}/rules`}
        method="get"
        className="mt-6 flex flex-wrap gap-2"
      >
        <Input
          name="q"
          defaultValue={query}
          placeholder={t("searchPlaceholder")}
          className="max-w-xs"
        />
        <select
          name="topic"
          defaultValue={topicId}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
        >
          <option value="">{t("allTopics")}</option>
          {topics.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.name[active]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          {t("search")}
        </Button>
      </form>

      {shown.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{t("noResults")}</p>
      ) : null}

      <div className="mt-6 space-y-8">
        {shown.map(({ topic: group, rules }) => (
          <section key={group.id} className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
              {group.name[active]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {rules.map((rule) => (
                <Link key={rule.id} href={`/rules/${rule.id}`}>
                  <Card className="h-full space-y-2 transition-colors hover:border-accent/50">
                    <CardTitle className="text-base">
                      {rule.name[active]}
                    </CardTitle>
                    <Tex tex={rule.statement} display className="py-1" />
                    <CardDescription>
                      <MathText text={rule.plain[active]} />
                    </CardDescription>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
