import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/** Phase 0 dashboard: the frame, the greeting, and honest empty state. */
export default async function DashboardPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");

  return (
    <AppShell locale={locale} user={user}>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("greeting", { name: user.displayName })}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(["practice", "learn", "exam", "stats"] as const).map((key) => (
          <Card key={key} className="space-y-1">
            <CardTitle>{tNav(key)}</CardTitle>
            <CardDescription>{t("comingSoon")}</CardDescription>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">{t("empty")}</p>
    </AppShell>
  );
}
