import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Dumbbell,
  Flame,
  RotateCw,
} from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getHeatmap, getStreak, getToday, getWeakestSkills } from "@/lib/stats/queries";
import { getReviewCount } from "@/lib/review/queue";
import { getDailyStreak } from "@/lib/daily/challenge";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Heatmap } from "@/components/stats/heatmap";
import { MasteryBars } from "@/components/stats/mastery-bars";

/**
 * The dashboard answers one question on opening the app: what should I do
 * right now? Streak, today's progress, the review queue, and the weakest
 * skills - each one a link into doing something about it.
 */
export default async function DashboardPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const user = await requireUser(locale);
  const t = await getTranslations("dashboard");
  const tStats = await getTranslations("stats");
  const tDaily = await getTranslations("daily");
  const active = locale as Locale;

  const [streak, today, heatmap, weakest, reviewCount, daily] =
    await Promise.all([
      getStreak(user.id),
      getToday(user.id),
      getHeatmap(user.id, 133),
      getWeakestSkills(user.id, 3),
      getReviewCount(user.id),
      getDailyStreak(user.id),
    ]);

  const accuracy =
    today.attempts === 0
      ? null
      : Math.round((today.correct / today.attempts) * 100);
  const started = today.attempts > 0 || streak.longest > 0;

  return (
    <AppShell locale={active} user={user}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("greeting", { name: user.displayName })}
        </h1>
        <p className="text-sm text-muted">
          {streak.todaySecured
            ? t("todayDone", { count: today.attempts })
            : t("todayToGo", {
                done: today.attempts,
                threshold: streak.threshold,
              })}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <Flame className="h-8 w-8 shrink-0 text-accent" />
          <div>
            <p className="text-3xl leading-none">{streak.current}</p>
            <p className="text-xs text-muted">{t("dayStreak")}</p>
          </div>
        </Card>
        <Card>
          <p className="text-3xl leading-none">{today.attempts}</p>
          <p className="text-xs text-muted">{t("questionsToday")}</p>
        </Card>
        <Card>
          <p className="text-3xl leading-none">
            {accuracy === null ? "—" : `${accuracy}%`}
          </p>
          <p className="text-xs text-muted">{t("accuracyToday")}</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          href="/daily"
          icon={<CalendarDays className="h-5 w-5" />}
          title={tDaily("cardTitle")}
          body={daily.doneToday ? tDaily("cardDone") : tDaily("cardBody")}
          primary={!daily.doneToday}
        />
        <ActionCard
          href="/practice"
          icon={<Dumbbell className="h-5 w-5" />}
          title={t("practiceTitle")}
          body={t("practiceBody")}
        />
        <ActionCard
          href="/review"
          icon={<RotateCw className="h-5 w-5" />}
          title={t("reviewTitle")}
          body={
            reviewCount > 0
              ? t("reviewBody", { count: reviewCount })
              : t("reviewEmpty")
          }
        />
        <ActionCard
          href="/learn"
          icon={<BookOpen className="h-5 w-5" />}
          title={t("learnTitle")}
          body={t("learnBody")}
        />
      </div>

      {started ? (
        <Card className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">{t("recentActivity")}</CardTitle>
            <Link
              href="/stats"
              className="flex items-center gap-1 text-sm text-accent hover:underline"
            >
              {t("allStats")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
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
      ) : (
        <Card className="mt-6 space-y-2">
          <CardTitle>{t("emptyTitle")}</CardTitle>
          <CardDescription>{t("empty")}</CardDescription>
        </Card>
      )}

      {weakest.length > 0 ? (
        <Card className="mt-6 space-y-4">
          <CardTitle className="text-base">{t("focusOn")}</CardTitle>
          <MasteryBars
            progress={weakest}
            locale={active}
            levelLabels={tStats("levels").split(",")}
            notEnoughLabel={tStats("notEnoughAttempts")}
            drillLabel={tStats("drill")}
          />
        </Card>
      ) : null}
    </AppShell>
  );
}

function ActionCard({
  href,
  icon,
  title,
  body,
  primary = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="group">
      <Card
        className={
          primary
            ? "h-full space-y-2 border-accent/40 transition-colors hover:border-accent"
            : "h-full space-y-2 transition-colors hover:border-accent/50"
        }
      >
        <span className="flex items-center gap-2 text-accent">{icon}</span>
        <CardTitle className="text-base group-hover:text-accent">
          {title}
        </CardTitle>
        <CardDescription>{body}</CardDescription>
      </Card>
    </Link>
  );
}
