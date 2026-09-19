// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/th.json";
import { HeaderXp } from "./header-xp";
import { XpProvider, useXpReporter } from "./xp-context";
import type { XpAward } from "@/lib/stats/constants";

/**
 * The level is in the header because that is where the learner's own face
 * already is; a second profile card in the page meant two faces on one screen
 * saying the same thing. What is worth testing is the join: a page reports an
 * award, and the header - a different component entirely - is what moves.
 */

/** Stands in for the runner: it only ever reports, it never draws. */
function Firer({ award }: { award: XpAward }) {
  const report = useXpReporter();
  return (
    <button type="button" onClick={() => report(award)}>
      fire
    </button>
  );
}

function setup(initialXp: number, award: XpAward) {
  const view = render(
    <NextIntlClientProvider locale="th" messages={messages}>
      <XpProvider initialXp={initialXp}>
        <HeaderXp />
        <Firer award={award} />
      </XpProvider>
    </NextIntlClientProvider>,
  );
  return { ...view, user: userEvent.setup() };
}

const meter = () => screen.getByRole("progressbar");
const fire = () => screen.getByRole("button", { name: "fire" });

const award = (total: number, parts: XpAward["parts"]): XpAward => ({
  total,
  parts,
});

const nothing = award(0, []);

describe("HeaderXp", () => {
  it("starts where the server says the learner is", () => {
    // 150 XP is level 2, 50 of the way into a 150 span.
    setup(150, nothing);
    expect(meter()).toHaveAttribute("aria-valuenow", "50");
    expect(meter()).toHaveAttribute("aria-valuemax", "150");
    expect(
      screen.getByTitle(messages.profile.level.replace("{level}", "2")),
    ).toHaveTextContent("2");
  });

  it("moves by what a reported answer earned", async () => {
    // Parts that do not individually equal the total, so "+9" is unambiguous.
    const { user } = setup(
      150,
      award(9, [
        { key: "answered", amount: 1 },
        { key: "correct", amount: 8 },
      ]),
    );

    await user.click(fire());

    await waitFor(() => expect(meter()).toHaveAttribute("aria-valuenow", "59"));
    expect(screen.getByText("+9")).toBeInTheDocument();
  });

  /** The reason the breakdown exists: what you did well, not just that you did. */
  it("itemises where the XP came from", async () => {
    const { user } = setup(
      150,
      award(8, [
        { key: "answered", amount: 1 },
        { key: "correct", amount: 5 },
        { key: "perfect", amount: 2 },
      ]),
    );

    await user.click(fire());

    await waitFor(() => expect(screen.getByText("+8")).toBeInTheDocument());
    expect(screen.getByText(messages.xp.answered)).toBeInTheDocument();
    expect(screen.getByText(messages.xp.correct)).toBeInTheDocument();
    expect(screen.getByText(messages.xp.perfect)).toBeInTheDocument();
    // Nothing claims a bonus that was not awarded.
    expect(screen.queryByText(messages.xp.streak)).not.toBeInTheDocument();
  });

  it("counts two identical awards as two events", async () => {
    const { user } = setup(150, award(4, [{ key: "correct", amount: 4 }]));

    await user.click(fire());
    await waitFor(() => expect(meter()).toHaveAttribute("aria-valuenow", "54"));

    await user.click(fire());
    await waitFor(() => expect(meter()).toHaveAttribute("aria-valuenow", "58"));
  });

  /**
   * Silent when it goes wrong, which is why it is pinned: adding `undefined`
   * makes the total NaN, `levelFromXp` clamps NaN to zero, and the header drops
   * to level 1 rather than failing.
   */
  it("ignores an award with no usable total", async () => {
    const { user } = setup(150, { total: Number.NaN, parts: [] });

    await user.click(fire());

    expect(meter()).toHaveAttribute("aria-valuenow", "50");
    expect(
      screen.getByTitle(messages.profile.level.replace("{level}", "2")),
    ).toHaveTextContent("2");
  });

  it("renders nothing at all outside a provider", () => {
    const { container } = render(
      <NextIntlClientProvider locale="th" messages={messages}>
        <HeaderXp />
      </NextIntlClientProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
