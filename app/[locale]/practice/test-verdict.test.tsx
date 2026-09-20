// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { TestVerdict } from "./test-verdict";
import type { LessonResult } from "@/lib/learn/progress";

/**
 * The bug this pins: a lesson test showed "not this time" for about a second
 * before turning into "passed".
 *
 * It was not a stale cache. The verdict arrives from a server action, and the
 * moment before it arrives was rendered with `verdict?.passed`, which is
 * `undefined` and therefore falsy and therefore the failure branch. Every test
 * did it; you only saw it when you passed, because a fail flashing a fail looks
 * like nothing happening.
 *
 * So the assertion that matters is the negative one: while the result is
 * unknown, the failure copy must not be on screen.
 */
const labels = {
  marking: "Marking your answers",
  passed: "Passed",
  failed: "Not this time",
  score: ({ score, total, needed }: Record<string, number>) =>
    `${score} of ${total} right - ${needed} needed`,
};

const result = (over: Partial<LessonResult> = {}): LessonResult => ({
  passed: true,
  newlyPassed: true,
  score: 9,
  needed: 8,
  ...over,
});

function shown(verdict: LessonResult | null) {
  const { container } = render(
    <TestVerdict verdict={verdict} asked={10} labels={labels} />,
  );
  return {
    state: container.querySelector("[data-verdict]")?.getAttribute("data-verdict"),
    text: container.textContent ?? "",
  };
}

describe("TestVerdict", () => {
  it("does not say you failed while the result is still unknown", () => {
    const { state, text } = shown(null);
    expect(state).toBe("marking");
    expect(text).not.toContain(labels.failed);
    expect(text).not.toContain(labels.passed);
    expect(text).toContain(labels.marking);
  });

  it("shows no score line until there is a score", () => {
    expect(shown(null).text).not.toContain("needed");
  });

  it("says passed once it knows you passed", () => {
    const { state, text } = shown(result());
    expect(state).toBe("pass");
    expect(text).toContain(labels.passed);
    expect(text).not.toContain(labels.failed);
    expect(text).toContain("9 of 10 right - 8 needed");
  });

  it("says failed once it knows you failed", () => {
    const { state, text } = shown(result({ passed: false, newlyPassed: false, score: 5 }));
    expect(state).toBe("fail");
    expect(text).toContain(labels.failed);
    expect(text).not.toContain(labels.passed);
  });

  /*
   * A retake of something already passed reports `passed` without
   * `newlyPassed`. It still passed - the tick is not taken away by a bad
   * retake - so the screen must say so.
   */
  it("treats an already-passed retake as a pass", () => {
    expect(shown(result({ newlyPassed: false })).state).toBe("pass");
  });

  it("announces the result to a screen reader when it replaces the waiting copy", () => {
    const { container } = render(
      <TestVerdict verdict={null} asked={10} labels={labels} />,
    );
    expect(container.querySelector("h2")?.getAttribute("aria-live")).toBe(
      "polite",
    );
  });
});
