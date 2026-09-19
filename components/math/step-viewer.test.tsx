// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { StepViewer } from "./step-viewer";
import { generateQuestion } from "@/content/generators";
import { allRules } from "@/content/rules";
import messages from "@/messages/th.json";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const ruleNames = Object.fromEntries(
  allRules.map((rule) => [rule.id, rule.name]),
);

function renderStepViewer(startRevealed = 1) {
  // A real question, so the component is fed what the app actually feeds it.
  const question = generateQuestion("quad.solve-factor-simple", 42, 1);
  render(
    <NextIntlClientProvider locale="th" messages={messages}>
      <StepViewer
        steps={question.steps}
        ruleNames={ruleNames}
        startRevealed={startRevealed}
      />
    </NextIntlClientProvider>,
  );
  return question;
}

describe("StepViewer", () => {
  it("shows one step at a time to begin with", () => {
    const question = renderStepViewer();
    expect(question.steps.length).toBeGreaterThan(1);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("reveals the next step when asked", async () => {
    const user = userEvent.setup();
    renderStepViewer();

    await user.click(
      screen.getByRole("button", { name: messages.practice.nextStep }),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("shows all of them at once when asked", async () => {
    const user = userEvent.setup();
    const question = renderStepViewer();

    await user.click(
      screen.getByRole("button", { name: messages.practice.showAllSteps }),
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(question.steps.length);
  });

  it("names the rule for each step, linking to its page", async () => {
    const user = userEvent.setup();
    const question = renderStepViewer();
    await user.click(
      screen.getByRole("button", { name: messages.practice.showAllSteps }),
    );

    for (const step of question.steps) {
      const name = ruleNames[step.ruleId]!.th;
      const chip = screen.getAllByRole("link", { name }).at(0);
      expect(chip, `no chip for ${step.ruleId}`).toBeInTheDocument();
      expect(chip).toHaveAttribute("href", `/rules/${step.ruleId}`);
    }
  });

  it("hides the controls once everything is showing", () => {
    const question = renderStepViewer(99);
    expect(screen.getAllByRole("listitem")).toHaveLength(question.steps.length);
    expect(
      screen.queryByRole("button", { name: messages.practice.showAllSteps }),
    ).not.toBeInTheDocument();
  });

  it("renders the maths rather than the source", () => {
    renderStepViewer(99);
    const rendered = [...document.querySelectorAll(".katex-html")];
    expect(rendered.length).toBeGreaterThan(0);

    // What a sighted reader sees carries no LaTeX commands...
    for (const fragment of rendered) {
      expect(fragment.textContent ?? "").not.toContain("\\left");
    }
    // ...while the MathML annotation keeps the source, which is what a screen
    // reader and a copy-paste rely on.
    expect(document.querySelector(".katex-mathml")).not.toBeNull();
  });
});
