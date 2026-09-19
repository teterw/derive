import { notFound } from "next/navigation";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { hasLocale } from "next-intl";
import { desc, eq } from "drizzle-orm";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { inviteCodes, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/current-user";
import { CheckCheck, Eraser, Flame, RotateCcw } from "lucide-react";
import {
  disableInviteCodeAction,
  passAllLessonsAction,
  resetMyDailyAction,
  resetMyLessonsAction,
  resetMyStreakAction,
  setUserRoleAction,
} from "@/lib/admin/actions";
import { formatInviteCode } from "@/lib/auth/invite";
import { AppShell } from "@/components/layout/app-shell";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getAdminUsers, getSiteStats } from "@/lib/admin/queries";
import { levelFromXp } from "@/lib/stats/level";
import { skills } from "@/content/topics";
import { AdminOverview } from "./admin-overview";
import { Button } from "@/components/ui/button";
import { InviteCodeForm } from "./invite-code-form";

type CodeStatus = "disabled" | "expired" | "exhausted" | "active";

function statusOf(code: typeof inviteCodes.$inferSelect): CodeStatus {
  if (code.disabled) return "disabled";
  if (code.expiresAt && code.expiresAt <= new Date()) return "expired";
  if (code.uses >= code.maxUses) return "exhausted";
  return "active";
}

export default async function AdminPage({
  params,
}: PageProps<"/[locale]/admin">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin");
  const format = await getFormatter();

  const totalLessons = skills.length;

  const [stats, allUsers] = await Promise.all([
    getSiteStats(),
    getAdminUsers(),
  ]);

  /*
   * Resolved here rather than inside the component, because the component is
   * the one piece of this page that has no business knowing about next-intl -
   * it takes numbers and words and draws them.
   */
  const overviewLabels = {
    title: t("overview"),
    users: t("statUsers"),
    admins: t("statAdmins"),
    activeToday: t("statActiveToday"),
    activeThisWeek: t("statActiveThisWeek"),
    attemptsToday: t("statAttemptsToday"),
    attemptsTotal: t("statAttemptsTotal"),
    dailyFinishedToday: t("statDailyToday"),
    lessonsPassed: t("statLessonsPassed"),
  };

  const codes = await db
    .select({
      code: inviteCodes,
      creator: { displayName: users.displayName },
    })
    .from(inviteCodes)
    .leftJoin(users, eq(users.id, inviteCodes.createdBy))
    .orderBy(desc(inviteCodes.createdAt));

  const toneOf: Record<CodeStatus, "correct" | "neutral" | "wrong"> = {
    active: "correct",
    exhausted: "neutral",
    expired: "neutral",
    disabled: "wrong",
  };

  return (
    <AppShell locale={locale} user={admin}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

      <AdminOverview stats={stats} labels={overviewLabels} />

      {/*
        These were hidden behind `NODE_ENV !== "production"`, which was wrong in
        both directions. It hid them from a local production build - `pnpm
        start` - which is exactly where they get used, and the reasoning for
        hiding them never held anyway: every one is admin-only, re-read from the
        session, and touches nothing but the caller's own rows. A button is not
        a security control, and these are ordinary admin tools rather than a
        back door left ajar.

        They still sit apart from the invite codes, because reaching for one by
        habit while meaning to do something else is a real way to lose an
        afternoon of your own data.
      */}
      <Card className="mt-6 space-y-4 border-dashed">
        <div className="space-y-1">
          <CardTitle className="text-base">{t("devTools")}</CardTitle>
          <CardDescription>{t("devToolsNote")}</CardDescription>
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={resetMyDailyAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
              {t("resetMyDaily")}
            </Button>
          </form>

          <form action={resetMyLessonsAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" size="sm">
              <Eraser className="h-4 w-4" />
              {t("resetMyLessons")}
            </Button>
          </form>

          <form action={passAllLessonsAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck className="h-4 w-4" />
              {t("passAllLessons")}
            </Button>
          </form>

          <form action={resetMyStreakAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" size="sm">
              <Flame className="h-4 w-4" />
              {t("resetMyStreak")}
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted">{t("devToolsHelp")}</p>
      </Card>

      <Card className="mt-6 space-y-5">
        <CardTitle>{t("inviteCodes")}</CardTitle>
        <InviteCodeForm locale={locale} />

        {codes.length === 0 ? (
          <CardDescription>{t("noCodes")}</CardDescription>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-medium">{t("code")}</th>
                  <th className="py-2 pr-4 font-medium">{t("note")}</th>
                  <th className="py-2 pr-4 font-medium">{t("uses")}</th>
                  <th className="py-2 pr-4 font-medium">{t("expires")}</th>
                  <th className="py-2 pr-4 font-medium">{t("status")}</th>
                  <th className="py-2 font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(({ code, creator }) => {
                  const status = statusOf(code);
                  return (
                    <tr key={code.id} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-mono tracking-wider">
                        {formatInviteCode(code.code)}
                      </td>
                      <td className="py-2 pr-4 text-muted">
                        {code.note ?? "—"}
                        {creator ? (
                          <span className="block text-xs">
                            {t("createdBy")} {creator.displayName}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">
                        {code.uses} / {code.maxUses}
                      </td>
                      <td className="py-2 pr-4 text-muted">
                        {code.expiresAt
                          ? format.dateTime(code.expiresAt, {
                              dateStyle: "medium",
                            })
                          : t("neverExpires")}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge tone={toneOf[status]}>{t(status)}</Badge>
                      </td>
                      <td className="py-2">
                        {status === "active" ? (
                          <form action={disableInviteCodeAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="id" value={code.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              {t("disable")}
                            </Button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-6 space-y-4">
        <CardTitle>{t("users")}</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr className="border-b border-border">
                <th className="py-2 pr-4 font-medium">{t("user")}</th>
                <th className="py-2 pr-4 font-medium">{t("role")}</th>
                <th className="py-2 pr-4 text-right font-medium">
                  {t("level")}
                </th>
                <th className="py-2 pr-4 text-right font-medium">
                  {t("lessons")}
                </th>
                <th className="py-2 pr-4 text-right font-medium">
                  {t("streakCol")}
                </th>
                <th className="py-2 pr-4 font-medium">{t("joined")}</th>
                <th className="py-2 pr-4 font-medium">{t("lastSeen")}</th>
                <th className="py-2 font-medium sr-only">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => {
                const level = levelFromXp(u.xp);
                const self = u.id === admin.id;
                return (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="py-2 pr-4">
                      {u.displayName}
                      <span className="block text-xs text-muted">
                        @{u.username}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge tone={u.role === "admin" ? "accent" : "neutral"}>
                        {u.role === "admin" ? t("roleAdmin") : t("roleUser")}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums">
                      {level.level}
                      <span className="block text-xs text-muted">
                        {u.xp.toLocaleString("en-US")}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums">
                      {u.lessonsPassed}
                      <span className="text-muted">/{totalLessons}</span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums">
                      {u.currentStreak}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-muted">
                      {format.dateTime(u.createdAt, { dateStyle: "medium" })}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-muted">
                      {format.relativeTime(u.lastSeenAt)}
                    </td>
                    <td className="py-2 text-right">
                      {/*
                        No control on your own row. Demoting yourself is not
                        catastrophic in theory - another admin could undo it -
                        but on a site with one admin it is unrecoverable
                        through the interface, and the way back is the
                        database.
                      */}
                      {self ? (
                        <span className="text-xs text-muted">
                          {t("thisIsYou")}
                        </span>
                      ) : (
                        <form action={setUserRoleAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="role"
                            value={u.role === "admin" ? "user" : "admin"}
                          />
                          <Button type="submit" variant="ghost" size="sm">
                            {u.role === "admin" ? t("demote") : t("promote")}
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
