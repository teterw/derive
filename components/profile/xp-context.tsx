"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { XpAward } from "@/lib/stats/constants";

/**
 * Lifetime XP, shared between the page earning it and the header showing it.
 *
 * The level lives on the avatar in the header, because that is the one place a
 * learner already is - putting a second profile card in the middle of the run
 * meant two faces on one screen saying the same thing. So the runner reports
 * what each answer earned and the header is what moves.
 *
 * It starts from the server's number and advances by what each answer reports,
 * rather than refetching: the server has already said what the attempt was
 * worth, and asking again per question would be a round trip to learn something
 * we were handed.
 */

export type ReportedAward = XpAward & { id: number };

type XpValue = {
  totalXp: number;
  /** The most recent award, with an id so a repeat still counts as an event. */
  award: ReportedAward | null;
  report: (award: XpAward) => void;
};

const XpContext = createContext<XpValue | null>(null);

export function XpProvider({
  initialXp,
  children,
}: {
  initialXp: number;
  children: ReactNode;
}) {
  const [totalXp, setTotalXp] = useState(initialXp);
  const [award, setAward] = useState<ReportedAward | null>(null);
  const nextId = useRef(0);

  const report = useCallback((next: XpAward) => {
    /*
     * A response that arrives without a usable total must not move anything:
     * adding `undefined` makes the total NaN, `levelFromXp` clamps NaN to zero,
     * and the level silently drops to 1 rather than failing.
     */
    if (!next || !Number.isFinite(next.total)) return;
    setTotalXp((current) => current + next.total);
    setAward({ ...next, id: nextId.current++ });
  }, []);

  const value = useMemo(
    () => ({ totalXp, award, report }),
    [totalXp, award, report],
  );

  return <XpContext.Provider value={value}>{children}</XpContext.Provider>;
}

/**
 * Reports an award. Returns a no-op outside a provider so a runner rendered in
 * isolation - a test, a story - does not have to care.
 */
export function useXpReporter(): (award: XpAward) => void {
  const context = useContext(XpContext);
  return context?.report ?? noop;
}

const noop = () => {};

/** What the header draws. Null outside a provider, so it can render nothing. */
export function useXpState(): Omit<XpValue, "report"> | null {
  const context = useContext(XpContext);
  if (!context) return null;
  return { totalXp: context.totalXp, award: context.award };
}
