// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { ToolDock } from "./tool-dock";
import { allRules } from "@/content/rules";
import messages from "@/messages/th.json";

/**
 * The dock, at the two widths it behaves differently at.
 *
 * jsdom has no layout and no media queries, so `matchMedia` is the only thing
 * the component can ask about the viewport - which is exactly why it asks
 * through `matchMedia` rather than by measuring something.
 */
const REAL_MATCH_MEDIA = window.matchMedia;

function viewport(desktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: desktop,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function renderDock() {
  render(
    <NextIntlClientProvider locale="th" messages={messages}>
      <ToolDock rules={allRules} desmosApiKey="" />
    </NextIntlClientProvider>,
  );
}

const CALCULATOR = messages.tools.calculator;
const FORMULAS = messages.tools.formulas;
const EXPRESSION = messages.tools.calculatorInput;

/** The round button in the dock, not the panel of the same name. */
function dockButton(name: string) {
  return screen.getByRole("button", { name });
}

function panel(name: string) {
  return screen.queryByRole("region", { name });
}

beforeEach(() => {
  document.documentElement.style.removeProperty("--tool-rail");
});

afterEach(() => {
  window.matchMedia = REAL_MATCH_MEDIA;
});

describe("ToolDock on a laptop", () => {
  beforeEach(() => viewport(true));

  it("keeps the calculator and the formula sheet open together", async () => {
    const user = userEvent.setup();
    renderDock();

    await user.click(dockButton(CALCULATOR));
    await user.click(dockButton(FORMULAS));

    expect(panel(CALCULATOR)).not.toBeNull();
    expect(panel(FORMULAS)).not.toBeNull();
  });

  it("makes room for the rail instead of covering the page", async () => {
    const user = userEvent.setup();
    renderDock();

    expect(
      document.documentElement.style.getPropertyValue("--tool-rail"),
    ).toBe("");

    await user.click(dockButton(CALCULATOR));
    expect(
      document.documentElement.style.getPropertyValue("--tool-rail"),
    ).not.toBe("");

    await user.click(dockButton(CALCULATOR));
    expect(
      document.documentElement.style.getPropertyValue("--tool-rail"),
    ).toBe("");
  });

  it("closes the panel opened last when Esc is pressed", async () => {
    const user = userEvent.setup();
    renderDock();

    await user.click(dockButton(CALCULATOR));
    await user.click(dockButton(FORMULAS));
    await user.keyboard("{Escape}");

    expect(panel(FORMULAS)).toBeNull();
    expect(panel(CALCULATOR)).not.toBeNull();
  });
});

describe("ToolDock below a laptop", () => {
  beforeEach(() => viewport(false));

  it("shows one tool at a time", async () => {
    const user = userEvent.setup();
    renderDock();

    await user.click(dockButton(CALCULATOR));
    expect(screen.getByLabelText(EXPRESSION)).toBeInTheDocument();

    await user.click(dockButton(FORMULAS));
    expect(screen.queryByLabelText(EXPRESSION)).toBeNull();
  });
});

/**
 * The bug this covers: the calculator's state lived inside the panel, so
 * closing it to read the question threw away the working. You cannot use a
 * calculator beside a question if looking at the question resets it.
 */
describe.each([
  ["on a laptop", true],
  ["below a laptop", false],
])("the calculator %s", (_where, desktop) => {
  beforeEach(() => viewport(desktop));

  it("still has its expression and its history when reopened", async () => {
    const user = userEvent.setup();
    renderDock();

    await user.click(dockButton(CALCULATOR));
    await user.type(screen.getByLabelText(EXPRESSION), "2+3{Enter}");
    expect(screen.getByLabelText(EXPRESSION)).toHaveValue("5");
    expect(screen.getByText("2+3")).toBeInTheDocument();

    await user.click(dockButton(CALCULATOR));
    expect(screen.queryByLabelText(EXPRESSION)).toBeNull();

    await user.click(dockButton(CALCULATOR));
    expect(screen.getByLabelText(EXPRESSION)).toHaveValue("5");
    expect(screen.getByText("2+3")).toBeInTheDocument();
  });

  it("works the keypad through the same state", async () => {
    const user = userEvent.setup();
    renderDock();

    await user.click(dockButton(CALCULATOR));
    await user.click(screen.getByRole("button", { name: "7" }));
    await user.click(screen.getByRole("button", { name: "×" }));
    await user.click(screen.getByRole("button", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "=" }));

    expect(screen.getByLabelText(EXPRESSION)).toHaveValue("56");
  });
});
