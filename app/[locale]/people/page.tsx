import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Flame } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { getPeople } from "@/lib/profile/queries";
import { compactXp } from "@/lib/stats/level";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Avatar, avatarSeed, avatarUrl } from "@/components/profile/avatar";
import { cn } from "@/lib/utils";

/**
 * Everyone, ranked by lifetime XP.
 *
 * Ranked by XP rather than accuracy on purpose: a board ranked by accuracy
 * rewards answering three easy questions and stopping. XP only moves by doing
 * the work, and it is weighted by difficulty, so the way up is to practise
 * more and harder - which is the behaviour worth encouraging.
 */
export default async function PeoplePage({
  params,
}: PageProps<"/[locale]/people">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const viewer = await requireUser(locale);
  const t = await getTranslations("people");
  const active = locale as Locale;

  const people = await getPeople();

  return (
    <AppShell locale={active} user={viewer}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted">{t("subtitle")}</p>
      </div>

      {people.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-muted">{t("empty")}</p>
        </Card>
      ) : (
        <ol className="mt-6 space-y-2">
          {people.map((person) => {
            const isMe = person.username === viewer.username;
            return (
              <li key={person.username}>
                <Link href={`/u/${person.username}`}>
                  <Card
                    className={cn(
                      "flex items-center gap-3 py-3 transition-colors hover:border-accent/50 sm:gap-4",
                      isMe && "border-accent/60 bg-accent/5",
                    )}
                  >
                    {/*
                      The top three get their rank in the accent; everyone else
                      gets it in muted. A medal emoji would be louder than the
                      information deserves on a study site.
                    */}
                    <span
                      className={cn(
                        "w-7 shrink-0 text-center font-mono text-sm tabular-nums",
                        person.rank <= 3 ? "text-accent" : "text-muted",
                      )}
                    >
                      {person.rank}
                    </span>

                    <Avatar
                      seed={avatarSeed(person.username, person.avatarSlot)}
                      src={avatarUrl(person.username, person.avatarUpdatedAt)}
                      size={36}
                      className="h-9 w-9"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm">
                        {person.username}
                      </span>
                      <span className="block text-xs text-muted">
                        {t("levelAndQuestions", {
                          level: person.level.level,
                          count: person.attempts,
                        })}
                      </span>
                    </span>

                    {person.currentStreak > 0 ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted">
                        <Flame className="h-3.5 w-3.5 text-accent" />
                        {person.currentStreak}
                      </span>
                    ) : null}

                    <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">
                      {compactXp(person.level.totalXp)}
                    </span>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-6 text-xs text-muted">{t("hiddenNote")}</p>
    </AppShell>
  );
}
