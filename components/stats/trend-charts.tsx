"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AccuracyPoint, SpeedPoint } from "@/lib/stats/queries";

/**
 * Two single-series line charts. One series each, so there is no legend to
 * draw and no palette to validate beyond the one accent - the title names the
 * series (docs/dataviz: a single series needs no legend box).
 *
 * Both ship a table view, so no value is reachable only through a tooltip.
 */

const AXIS = "var(--muted)";
const GRID = "var(--border)";
const LINE = "var(--accent)";

function TooltipBox({
  label,
  rows,
}: {
  label: string;
  rows: { text: string }[];
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{label}</p>
      {rows.map((row) => (
        <p key={row.text} className="text-muted">
          {row.text}
        </p>
      ))}
    </div>
  );
}

export function AccuracyTrend({
  points,
  labels,
}: {
  points: AccuracyPoint[];
  labels: {
    title: string;
    subtitle: string;
    accuracy: string;
    empty: string;
    showTable: string;
    hideTable: string;
    day: string;
  };
}) {
  const [showTable, setShowTable] = useState(false);
  const withData = points.filter((point) => point.accuracy !== null);

  if (withData.length < 2) {
    return <EmptyChart title={labels.title} message={labels.empty} />;
  }

  return (
    <figure className="space-y-2">
      <figcaption className="space-y-0.5">
        <h3 className="text-sm font-medium">{labels.title}</h3>
        <p className="text-xs text-muted">{labels.subtitle}</p>
      </figcaption>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
          >
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              minTickGap={40}
              tickFormatter={(day: string) => day.slice(5)}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => `${value}%`}
            />
            <Tooltip
              cursor={{ stroke: AXIS, strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipBox
                    label={String(label)}
                    rows={[
                      {
                        text: `${labels.accuracy}: ${payload[0]!.value}%`,
                      },
                    ]}
                  />
                ) : null
              }
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke={LINE}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <TableToggle
        open={showTable}
        onToggle={() => setShowTable((value) => !value)}
        labels={labels}
      >
        <table className="w-full text-xs">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1 font-medium">{labels.day}</th>
              <th className="py-1 font-medium">{labels.accuracy}</th>
            </tr>
          </thead>
          <tbody>
            {withData.map((point) => (
              <tr key={point.day} className="border-t border-border/60">
                <td className="py-1 tabular-nums">{point.day}</td>
                <td className="py-1 tabular-nums">{point.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </figure>
  );
}

export function SpeedTrend({
  points,
  labels,
}: {
  points: SpeedPoint[];
  labels: {
    title: string;
    subtitle: string;
    seconds: string;
    empty: string;
    showTable: string;
    hideTable: string;
    week: string;
  };
}) {
  const [showTable, setShowTable] = useState(false);

  if (points.length < 2) {
    return <EmptyChart title={labels.title} message={labels.empty} />;
  }

  return (
    <figure className="space-y-2">
      <figcaption className="space-y-0.5">
        <h3 className="text-sm font-medium">{labels.title}</h3>
        <p className="text-xs text-muted">{labels.subtitle}</p>
      </figcaption>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 8, bottom: 4, left: -16 }}
          >
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              minTickGap={30}
              tickFormatter={(week: string) => week.slice(5)}
            />
            <YAxis
              tick={{ fill: AXIS, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => `${value}s`}
            />
            <Tooltip
              cursor={{ stroke: AXIS, strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipBox
                    label={String(label)}
                    rows={[
                      { text: `${labels.seconds}: ${payload[0]!.value}s` },
                    ]}
                  />
                ) : null
              }
            />
            <Line
              type="monotone"
              dataKey="medianSec"
              stroke={LINE}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2, stroke: "var(--surface)" }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <TableToggle
        open={showTable}
        onToggle={() => setShowTable((value) => !value)}
        labels={labels}
      >
        <table className="w-full text-xs">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1 font-medium">{labels.week}</th>
              <th className="py-1 font-medium">{labels.seconds}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.week} className="border-t border-border/60">
                <td className="py-1 tabular-nums">{point.week}</td>
                <td className="py-1 tabular-nums">{point.medianSec}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </figure>
  );
}

function EmptyChart({ title, message }: { title: string; message: string }) {
  return (
    <figure className="space-y-2">
      <figcaption>
        <h3 className="text-sm font-medium">{title}</h3>
      </figcaption>
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
        {message}
      </div>
    </figure>
  );
}

function TableToggle({
  open,
  onToggle,
  labels,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  labels: { showTable: string; hideTable: string };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="cursor-pointer text-xs text-muted underline-offset-2 hover:text-fg hover:underline"
      >
        {open ? labels.hideTable : labels.showTable}
      </button>
      {open ? (
        <div className="max-h-64 overflow-y-auto rounded-md border border-border p-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}
