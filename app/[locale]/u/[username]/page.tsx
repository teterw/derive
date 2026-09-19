import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Award, Settings, Target, TrendingUp } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import {
  getProfile,
  getProfileHeatmap,
  getRank,
} from "@/lib/profile/queries";
import { compactXp } from "@/lib/stats/level";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heatmap } from "@/components/stats/heatmap";
import { ProfileCard } from "@/components/profile/profile-card";

/**
 * Someone's profile. Visible to everyone with an account (PROMPT.md §12) -
 * this is an invite-only site, so everyone here was vouched for by someone.
 */
export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/u/[username]">) {
  const { locale, username } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireUser(locale);
  const t = await getTranslations("profile");
  const tStats = await getTranslations("stats");
  const format = await getFormatter();
  const active = locale as Locale;

  const profile = await getProfile(username);
  if (!profile) notFound();

  const [rank, heatmap] = await Promise.all([
    getRank(profile.username),
    getProfileHeatmap(profile.username, 133),
  ]);

  const isMe = viewer.username === profile.username;

  return (
    <AppShell locale={active} user={viewer}>
      <ProfileCard
        profile={profile}
        labels={{
          joined: t("joined", {
            date: format.dateTime(profile.joinedAt, { dateStyle: "medium" }),
          }),
          streak: t("currentStreak", { count: profile.currentStreak }),
          level: t("level", { level: profile.level.level }),
        }}
      />

      {isMe ? (
        <div className="mt-3 flex justify-end">
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
              {t("editProfile")}
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure
          icon={<TrendingUp className="h-4 w-4" />}
          value={compactXp(profile.level.totalXp)}
          label={t("totalXp")}
        />
        <Figure
          icon={<Target className="h-4 w-4" />}
          value={profile.accuracy === null ? "—" : `${profile.accuracy}%`}
          label={t("accuracy")}
        />
        <Figure
          icon={<Award className="h-4 w-4" />}
          value={rank === null ? "—" : `#${rank}`}
          label={t("rank")}
        />
        <Figure
          value={String(profile.totalAttempts)}
          label={t("questionsAnswered")}
        />
      </div>

      <Card className="mt-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <CardTitle className="text-base">{t("activity")}</CardTitle>
          <p className="text-xs text-muted">
            {t("daysPractised", { count: profile.daysPractised })}
          </p>
        </div>
        <Heatmap
          days={heatmap}
          labels={{
            less: tStats("less"),
            more: tStats("more"),
            noPractice: tStats("noPractice"),
            questions: tStats("questionsWord"),
            accuracy: tStats("accuracyWord"),
          }}
          monthNames={tStats("monthsShort").split(",")}
          weekdayNames={tStats("weekdaysShort").split(",")}
        />
      </Card>

      <div className="mt-6">
        <Link
          href="/people"
          className="text-sm text-accent hover:underline"
        >
          {t("seeEveryone")}
        </Link>
      </div>
    </AppShell>
  );
}

function Figure({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card className="space-y-1 py-4 text-center">
      <p className="flex items-center justify-center gap-1.5 text-xl tabular-nums sm:text-2xl">
        {icon ? <span className="text-accent">{icon}</span> : null}
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </Card>
  );
}
