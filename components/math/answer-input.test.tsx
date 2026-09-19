// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { AnswerInput } from "./answer-input";
import { checkAnswer } from "@/lib/math/check";
import messages from "@/messages/th.json";

/**
 * MathLive is not loadable under jsdom - the web component mounts but cannot
 * be typed into - so these tests pin the *fallback* path, which is a real
 * shipped code path: any learner whose browser fails to fetch the 220KB
 * field gets exactly this plain box. The maths-field path has its own file.
 */
vi.mock("mathlive", () => {
  throw new Error("mathlive is unavailable in this environment");
});

/**
 * The keypad exists so that maths can be typed on a phone. What matters is
 * that what it inserts is what the answer checker accepts - a private format
 * that needs translating later would be worse than no keypad at all.
 */
function Harness({ onSubmit = () => {} }: { onSubmit?: () => void }) {
  const [value, setValue] = useState("");
  return (
    <NextIntlClientProvider locale="th" messages={messages}>
      <AnswerInput
        value={value}
        onChange={setValue}
        onSubmit={onSubmit}
        state="idle"
      />
      <output data-testid="value">{value}</output>
    </NextIntlClientProvider>
  );
}

const box = () =>
  screen.getByLabelText(messages.practice.yourAnswer) as HTMLInputElement;
const value = () => screen.getByTestId("value").textContent ?? "";

/**
 * What a sighted learner actually reads. KaTeX renders twice - visible HTML
 * plus a MathML tree carrying the TeX source for screen readers and
 * copy-paste - so plain `textContent` always contains the raw `\sqrt{2}` and
 * proves nothing about what is on screen.
 */
export function visibleText(root: Element): string {
  const html = root.querySelector(".katex-html");
  return (html ?? root).textContent ?? "";
}

describe("AnswerInput", () => {
  it("types straight into the box", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(box(), "2/3");
    expect(value()).toBe("2/3");
  });

  it("submits on Enter", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Harness onSubmit={onSubmit} />);
    await user.type(box(), "5{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("puts the caret inside the brackets a key opens", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "√" }));
    // Keyboard, not type(): type() clicks first, which would move the caret
    // to the end - exactly what the key is trying to avoid.
    await user.keyboard("18");

    expect(value()).toBe("sqrt(18)");
  });

  it("inserts notation the answer checker actually accepts", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(box(), "2");
    await user.click(screen.getByRole("button", { name: "√" }));
    await user.keyboard("3");

    expect(value()).toBe("2sqrt(3)");
    expect(
      checkAnswer({ kind: "exact", value: "2*sqrt(3)" }, value()).correct,
    ).toBe(true);
  });

  it("builds a power the checker understands", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(box(), "x");
    await user.click(screen.getByRole("button", { name: "x²" }));

    expect(value()).toBe("x^2");
    expect(checkAnswer({ kind: "exact", value: "x*x" }, value()).correct).toBe(
      true,
    );
  });

  /**
   * The preview is the only thing standing between a learner and submitting
   * `2^-3` when they meant `2^(-3)`. If it stops rendering, or renders the
   * keystrokes back at them, it has stopped doing its job.
   */
  describe("the preview", () => {
    const preview = () => screen.getByTestId("answer-preview");

    it("shows nothing before anything is typed", () => {
      render(<Harness />);
      expect(preview().textContent?.trim()).toBe("");
    });

    it("shows the maths, not the keystrokes", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.type(box(), "3sqrt(2)");

      expect(preview().querySelector(".katex")).toBeTruthy();
      // Not `textContent`: KaTeX also emits a MathML annotation holding the
      // TeX source, deliberately, so a formula can be copied out. What the
      // learner *sees* is `.katex-html`.
      expect(visibleText(preview())).not.toContain("sqrt");
      expect(visibleText(preview())).toContain("2");
    });

    it("renders a power as a power", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.type(box(), "m^5");

      const annotation = preview().querySelector(
        'annotation[encoding="application/x-tex"]',
      );
      expect(annotation?.textContent).toBe("m^{5}");
    });

    it("says so rather than guessing when the input is half-typed", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.type(box(), "2x +");

      expect(preview().textContent).toContain(messages.practice.cannotReadYet);
    });

    it("recovers as soon as the input is complete again", async () => {
      const user = userEvent.setup();
      render(<Harness />);

      await user.type(box(), "(x+1");
      expect(preview().textContent).toContain(messages.practice.cannotReadYet);

      await user.type(box(), ")");
      expect(preview().querySelector(".katex")).toBeTruthy();
    });
  });

  it("goes quiet once the question is answered", async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="th" messages={messages}>
        <AnswerInput
          value="2"
          onChange={() => {}}
          onSubmit={() => {}}
          disabled
          state="correct"
        />
      </NextIntlClientProvider>,
    );

    expect(box()).toBeDisabled();
    for (const key of screen.getAllByRole("button")) {
      expect(key).toBeDisabled();
    }
    await user.click(screen.getByRole("button", { name: "√" }));
  });
});
