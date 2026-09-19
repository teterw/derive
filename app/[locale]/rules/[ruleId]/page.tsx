import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { allRules, getRule, hasRule } from "@/content/rules";
import { getTopic, skills } from "@/content/topics";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Tex } from "@/components/math/katex";
import { MathText } from "@/components/math/math-text";

export function generateStaticParams() {
  return allRules.map((rule) => ({ ruleId: rule.id }));
}

export default async function RulePage({
  params,
}: PageProps<"/[locale]/rules/[ruleId]">) {
  const { locale, ruleId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  if (!hasRule(ruleId)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("rules");

  const tNav = await getTranslations("nav");
  const active = locale as Locale;
  const rule = getRule(ruleId);

  // Which skills lean on this rule - the way back into practising it.
  const relatedSkills = skills.filter((skill) =>
    skill.ruleIds.includes(rule.id),
  );

  return (
    <AppShell
      locale={active}
      user={user}
      back={{ href: "/rules", label: tNav("backToRules") }}
    >
      <article className="mx-auto w-full max-w-2xl space-y-8">
        <header className="space-y-3">
          <Link href="/rules" className="text-xs text-muted hover:text-fg">
            {t("title")}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {rule.name[active]}
          </h1>
          <p className="font-mono text-xs text-muted">{rule.id}</p>
        </header>

        <Card className="space-y-3">
          <Tex tex={rule.statement} display className="text-xl" />
          {rule.conditions ? (
            <p className="text-center text-sm text-muted">
              <MathText text={rule.conditions[active]} />
            </p>
          ) : null}
        </Card>

        {/*
          The chant comes before the explanation, because for a learner who
          has been taught it, it *is* the explanation - and for one who has
          not, it is the line their tutor will use next week.
        */}
        {rule.mnemonic ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
              {t("howItIsRemembered")}
            </h2>
            <p className="rounded-lg border-l-2 border-accent bg-accent/5 px-4 py-3 text-lg leading-relaxed">
              <MathText text={rule.mnemonic[active]} />
            </p>
          </section>
        ) : null}

        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            {t("inPlainWords")}
          </h2>
          <p>
            <MathText text={rule.plain[active]} />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
            {t("examples")}
          </h2>
          <ul className="space-y-3">
            {rule.examples.map((example, index) => (
              <li
                key={index}
                className="rounded-lg border border-border bg-surface-2/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Tex tex={example.from} />
                  <ArrowRight className="h-4 w-4 text-muted" />
                  <Tex tex={example.to} />
                </div>
                {example.note ? (
                  <p className="mt-2 text-center text-sm text-muted">
                    <MathText text={example.note[active]} />
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {rule.seeAlso && rule.seeAlso.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
              {t("seeAlso")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {rule.seeAlso.map((id) => (
                <Link
                  key={id}
                  href={`/rules/${id}`}
                  className="rounded-full border border-border px-3 py-1 text-sm hover:border-accent/50 hover:text-accent"
                >
                  {getRule(id).name[active]}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {relatedSkills.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">
              {t("whereItIsUsed")}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {relatedSkills.map((skill) => (
                <Link key={skill.id} href={`/learn/${skill.id}`}>
                  <Card className="h-full space-y-1 p-4 transition-colors hover:border-accent/50">
                    <CardTitle className="text-sm">
                      {skill.name[active]}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {getTopic(skill.topicId).name[active]}
                    </CardDescription>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </AppShell>
  );
}
