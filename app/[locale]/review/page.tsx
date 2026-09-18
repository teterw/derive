import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { RotateCw } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getReviewCountsBySkill } from "@/lib/review/queue";
import { getSkill, getTopic } from "@/content/topics";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/**
 * ทบทวน. Everything whose most recent attempt was wrong, waiting to be met
 * again - the same question, not a similar one.
 */
export default async function ReviewPage({
  params,
}: PageProps<"/[locale]/review">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("review");
  const active = locale as Locale;

  const bySkill = await getReviewCountsBySkill(user.id);
  const total = bySkill.reduce((sum, row) => sum + row.count, 0);

  return (
    <AppShell locale={active} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

      {total === 0 ? (
        <Card className="mt-6 space-y-2">
          <CardTitle>{t("emptyTitle")}</CardTitle>
          <CardDescription>{t("emptyBody")}</CardDescription>
          <Link
            href="/practice"
            className="text-sm text-accent hover:underline"
          >
            {t("goPractise")}
          </Link>
        </Card>
      ) : (
        <>
          <Card className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-4xl tabular-nums">{total}</p>
              <p className="text-sm text-muted">{t("waiting")}</p>
            </div>
            <Link
              href="/review/run"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-accent px-6 font-medium text-accent-fg hover:opacity-90"
            >
              <RotateCw className="h-4 w-4" />
              {t("start")}
            </Link>
          </Card>

          <Card className="mt-6 space-y-3">
            <CardTitle className="text-base">{t("bySkill")}</CardTitle>
            <ul className="divide-y divide-border">
              {bySkill.map((row) => {
                const skill = safeSkill(row.skillId);
                return (
                  <li
                    key={row.skillId}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm">
                        {skill ? skill.name[active] : row.skillId}
                      </span>
                      {skill ? (
                        <span className="block text-xs text-muted">
                          {getTopic(skill.topicId).name[active]}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-sm tabular-nums text-muted">
                        {row.count}
                      </span>
                      <Link
                        href={`/review/run?skills=${row.skillId}`}
                        className="text-xs text-accent hover:underline"
                      >
                        {t("drillThis")}
                      </Link>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </AppShell>
  );
}

/** A skill id from an old attempt may no longer exist in the content. */
function safeSkill(skillId: string) {
  try {
    return getSkill(skillId);
  } catch {
    return null;
  }
}
