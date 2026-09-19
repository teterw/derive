import { Card, CardTitle } from "@/components/ui/card";
import type { SiteStats } from "@/lib/admin/queries";

/**
 * Eight numbers, in the order the questions get asked: who is here, who is
 * using it, and is today working.
 *
 * Deliberately not charts. An admin page for a site with tens of accounts is
 * read in five seconds on the way to doing something else, and a number you can
 * read is worth more than a trend you have to interpret. `/stats` is where
 * anything that wants a shape belongs.
 */
export function AdminOverview({
  stats,
  labels,
}: {
  stats: SiteStats;
  labels: {
    title: string;
    users: string;
    admins: string;
    activeToday: string;
    activeThisWeek: string;
    attemptsToday: string;
    attemptsTotal: string;
    dailyFinishedToday: string;
    lessonsPassed: string;
  };
}) {
  const figures: { label: string; value: number }[] = [
    { label: labels.users, value: stats.users },
    { label: labels.admins, value: stats.admins },
    { label: labels.activeToday, value: stats.activeToday },
    { label: labels.activeThisWeek, value: stats.activeThisWeek },
    { label: labels.attemptsToday, value: stats.attemptsToday },
    { label: labels.attemptsTotal, value: stats.attemptsTotal },
    { label: labels.dailyFinishedToday, value: stats.dailyFinishedToday },
    { label: labels.lessonsPassed, value: stats.lessonsPassed },
  ];

  return (
    <Card className="mt-6 space-y-4">
      <CardTitle className="text-base">{labels.title}</CardTitle>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        {figures.map((figure) => (
          <div key={figure.label} className="space-y-1">
            {/*
              Number first and large, label under it small: these are scanned
              down the column, and a row of labels with numbers hidden among
              them is a table you have to read rather than a set you can take
              in at once.
            */}
            <dd className="font-mono text-2xl leading-none tabular-nums">
              {figure.value.toLocaleString("en-US")}
            </dd>
            <dt className="text-xs leading-tight text-muted">{figure.label}</dt>
          </div>
        ))}
      </dl>
    </Card>
  );
}
