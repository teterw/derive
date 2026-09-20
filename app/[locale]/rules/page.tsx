import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { allRules, rulesForTopic, searchRules } from "@/content/rules";
import { groupByFamily } from "@/content/rules/families";
import { topics } from "@/content/topics";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Chapter } from "@/components/ui/chapter";
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

  /**
   * Grouped by what a rule *does*, not by which chapter uses it.
   *
   * Grouping by topic showed a rule once per chapter that referenced it - 115
   * rules made 171 cards - and answered "where would I meet this?" when the
   * question a formula sheet is opened with is "what does this kind of thing
   * do?". Every rule about roots together, every rule about powers together.
   *
   * The chapter filter still narrows, it just no longer decides the headings.
   */
  const matching = new Set(searchRules(query).map((rule) => rule.id));
  const inTopic = topicId
    ? new Set(rulesForTopic(topicId).map((rule) => rule.id))
    : null;

  const shown = groupByFamily(
    allRules.filter(
      (rule) =>
        matching.has(rule.id) && (inTopic === null || inTopic.has(rule.id)),
    ),
  );

  /*
   * Shut by default, because the point of the change is that fifteen headings
   * fit on a screen and 115 cards do not. A search is the exception: you have
   * asked a question, and the answer should not need a second click.
   */
  const searching = query.trim() !== "" || topicId !== "";

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
        {/*
          Both of these carried no name at all - the search box had a
          placeholder, which is not a label: it disappears the moment you type,
          and it is not reliably announced. The select had nothing.
        */}
        <Input
          name="q"
          defaultValue={query}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="max-w-xs"
        />
        <select
          name="topic"
          defaultValue={topicId}
          aria-label={t("allTopics")}
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

      <div className="mt-6 space-y-3">
        {shown.map(({ family, rules }) => (
          <Chapter
            key={family.prefix}
            title={family.name[active]}
            meta={family.blurb[active]}
            /* A count, not a progress bar: a formula sheet has nothing to be
               part-way through. */
            trailing={
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {rules.length}
              </span>
            }
            open={searching}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {rules.map((rule) => (
                <Link key={rule.id} href={`/rules/${rule.id}`}>
                  <Card className="h-full space-y-2 transition-colors hover:border-accent/50">
                    <CardTitle className="text-base">
                      {rule.name[active]}
                    </CardTitle>
                    <Tex tex={rule.statement} display className="py-1" />
                    {rule.mnemonic ? (
                      <p className="border-l-2 border-accent pl-2 text-sm">
                        <MathText text={rule.mnemonic[active]} />
                      </p>
                    ) : null}
                    <CardDescription>
                      <MathText text={rule.plain[active]} />
                    </CardDescription>
                  </Card>
                </Link>
              ))}
            </div>
          </Chapter>
        ))}
      </div>
    </AppShell>
  );
}
