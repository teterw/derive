// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { AnswerInput } from "./answer-input";
import messages from "@/messages/th.json";

/**
 * The other half of `answer-input.test.tsx`, which pins the fallback.
 *
 * Here MathLive "loads" - a stub, because the real one cannot be driven under
 * jsdom - so what is under test is the handover: once the maths field is live
 * the plain box must leave the tree, the keypad must drive the field rather
 * than splice text, and the preview must disappear because the field itself
 * is the rendered form.
 */

const executeCommand = vi.fn(() => true);

vi.mock("mathlive", () => {
  class StubMathField extends HTMLElement {
    value = "";
    menuItems: unknown[] = [];
    mathVirtualKeyboardPolicy = "auto";
    smartMode = false;
    readonly = false;
    executeCommand = executeCommand;
  }
  if (!customElements.get("math-field")) {
    customElements.define("math-field", StubMathField);
  }
  return {};
});

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

const frame = () => document.querySelector("[data-mathfield]")!;
const field = () => document.querySelector("math-field");

async function renderReady() {
  render(<Harness />);
  await waitFor(() => expect(frame().getAttribute("data-mathfield")).toBe("on"));
}

describe("AnswerInput with the maths field", () => {
  it("takes over once MathLive has loaded", async () => {
    await renderReady();
    expect(field()).toBeTruthy();
  });

  it("removes the plain box, so there is only one place to type", async () => {
    await renderReady();
    expect(
      screen.queryByLabelText(messages.practice.yourAnswer)?.tagName,
    ).not.toBe("INPUT");
    expect(document.querySelector("input[type]")).toBeNull();
  });

  it("drops the preview, because the field is already the rendered form", async () => {
    await renderReady();
    expect(screen.getByTestId("answer-preview").textContent?.trim()).toBe("");
  });

  /**
   * The keypad has two jobs depending on which input is live: splice text into
   * the plain box, or build notation in the field. Pressing the fraction key
   * has to produce a real fraction with an empty box to fill, not the
   * character `/`.
   */
  it("builds notation in the field rather than splicing text", async () => {
    const user = userEvent.setup();
    await renderReady();
    executeCommand.mockClear();

    await user.click(screen.getByRole("button", { name: "÷" }));

    expect(executeCommand).toHaveBeenCalledWith([
      "insert",
      "\\frac{#@}{#?}",
    ]);
  });

  it("uses a radical for the root key, not the letters sqrt", async () => {
    const user = userEvent.setup();
    await renderReady();
    executeCommand.mockClear();

    await user.click(screen.getByRole("button", { name: "√" }));

    expect(executeCommand).toHaveBeenCalledWith(["insert", "\\sqrt{#0}"]);
  });

  it("turns the field read-only rather than leaving it live once answered", async () => {
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

    await waitFor(() => expect(field()).toBeTruthy());
    await waitFor(() =>
      expect((field() as unknown as { readonly: boolean }).readonly).toBe(true),
    );
  });
});
