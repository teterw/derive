import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { desc, eq } from "drizzle-orm";
import { routing } from "@/i18n/routing";
import { db } from "@/lib/db";
import { inviteCodes, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/current-user";
import { RotateCcw } from "lucide-react";
import { disableInviteCodeAction, resetMyDailyAction } from "@/lib/admin/actions";
import { formatInviteCode } from "@/lib/auth/invite";
import { AppShell } from "@/components/layout/app-shell";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";
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

  const codes = await db
    .select({
      code: inviteCodes,
      creator: { displayName: users.displayName },
    })
    .from(inviteCodes)
    .leftJoin(users, eq(users.id, inviteCodes.createdBy))
    .orderBy(desc(inviteCodes.createdAt));

  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

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

      {/*
        A development tool, kept visibly separate from the real admin controls
        so nobody reaches for it by habit - and not rendered at all in
        production, where a card labelled "for development only" is a promise
        the deployment is not keeping.

        The action behind it stays authorised either way; hiding a button is
        not a security control. It is admin-only and only ever touches the
        caller's own run.
      */}
      {process.env.NODE_ENV === "production" ? null : (
        <Card className="mt-6 space-y-3 border-dashed">
          <div className="space-y-1">
            <CardTitle className="text-base">{t("devTools")}</CardTitle>
            <CardDescription>{t("devToolsNote")}</CardDescription>
          </div>
          <form action={resetMyDailyAction}>
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
              {t("resetMyDaily")}
            </Button>
          </form>
          <p className="text-xs text-muted">{t("resetMyDailyHelp")}</p>
        </Card>
      )}

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
                <th className="py-2 pr-4 font-medium">{t("joined")}</th>
                <th className="py-2 font-medium">{t("lastSeen")}</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
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
                  <td className="py-2 pr-4 text-muted">
                    {format.dateTime(u.createdAt, { dateStyle: "medium" })}
                  </td>
                  <td className="py-2 text-muted">
                    {format.relativeTime(u.lastSeenAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
