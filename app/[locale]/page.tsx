import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  RotateCw,
} from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getHeatmap, getStreak, getToday, getWeakestSkills } from "@/lib/stats/queries";
import { getReviewCount } from "@/lib/review/queue";
import { getDueCount } from "@/lib/review/due";
import { getDailyStreak } from "@/lib/daily/challenge";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

  const [streak, today, heatmap, weakest, reviewCount, dueCount, daily] =
    await Promise.all([
      getStreak(user.id),
      getToday(user.id),
      getHeatmap(user.id, 133),
      getWeakestSkills(user.id, 3),
      getReviewCount(user.id),
      getDueCount(user.id),
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

      {/*
        One card divided into three, not three cards.

        Three separate bordered boxes for three related numbers was a lot of
        chrome for very little information, and on a phone they stacked into
        three full-width rows - most of a screen to say "0, 5, 60%". Reading
        them side by side is the point: they are one status line.
      */}
      <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-surface">
        <Stat value={String(streak.current)} label={t("dayStreak")} icon={<Flame />} />
        <Stat value={String(today.attempts)} label={t("questionsToday")} />
        <Stat
          value={accuracy === null ? "—" : `${accuracy}%`}
          label={t("accuracyToday")}
        />
      </div>

      {/*
        Four ways in, each previously carrying a sentence explaining itself.
        A learner opening the app already knows what "ฝึกโจทย์" means; the
        sentence under it was read once and then became noise on every visit.

        What is *not* noise is state: how many questions are waiting in the
        review queue, whether today's daily is done. That varies, so that is
        what each tile now carries - as a number or a tick, not a sentence.
      */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ActionCard
          href="/daily"
          icon={<CalendarDays className="h-5 w-5" />}
          title={tDaily("cardTitle")}
          done={daily.doneToday}
          primary={!daily.doneToday}
        />
        <ActionCard
          href="/practice"
          icon={<Dumbbell className="h-5 w-5" />}
          title={t("practiceTitle")}
        />
        <ActionCard
          href="/review"
          icon={<RotateCw className="h-5 w-5" />}
          title={t("reviewTitle")}
          count={dueCount + reviewCount}
        />
        <ActionCard
          href="/learn"
          icon={<BookOpen className="h-5 w-5" />}
          title={t("learnTitle")}
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

/** One number and its name, inside the shared status card. */
function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2 py-4 text-center">
      <span className="flex items-center gap-1.5">
        {icon ? (
          <span className="text-accent [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
        ) : null}
        <span className="text-2xl leading-none tabular-nums sm:text-3xl">
          {value}
        </span>
      </span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  /** Shown as a badge when there is something waiting. */
  count,
  done = false,
  primary = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  count?: number;
  done?: boolean;
  primary?: boolean;
}) {
  return (
    <Link href={href} className="group">
      <Card
        className={cn(
          "flex h-full items-center gap-3 py-4 transition-colors",
          primary
            ? "border-accent/40 hover:border-accent"
            : "hover:border-accent/50",
        )}
      >
        <span className="shrink-0 text-accent">{icon}</span>
        <CardTitle className="min-w-0 flex-1 text-sm leading-tight group-hover:text-accent sm:text-base">
          {title}
        </CardTitle>
        {done ? (
          <Check className="h-4 w-4 shrink-0 text-correct" />
        ) : count && count > 0 ? (
          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs tabular-nums text-accent-fg">
            {count}
          </span>
        ) : null}
      </Card>
    </Link>
  );
}
