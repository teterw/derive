import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { eq } from "drizzle-orm";
import { routing, type Locale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: PageProps<"/[locale]/settings">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("settings");
  const active = locale as Locale;

  const [row] = await db
    .select({
      displayName: users.displayName,
      bio: users.bio,
      avatarSlot: users.avatarSlot,
      hideFromLeaderboard: users.hideFromLeaderboard,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row) notFound();

  return (
    <AppShell locale={active} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

      <Card className="mt-6 max-w-xl">
        <SettingsForm
          locale={locale}
          username={user.username}
          initial={{
            displayName: row.displayName,
            bio: row.bio ?? "",
            avatarSlot: row.avatarSlot,
            hideFromLeaderboard: row.hideFromLeaderboard,
          }}
        />
      </Card>
    </AppShell>
  );
}
