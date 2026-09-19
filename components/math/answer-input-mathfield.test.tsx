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
  /**
   * The stub refuses anything the real element refuses.
   *
   * MathLive throws "Mathfield not mounted" for any property that reaches
   * into its internals while the element is detached, and `menuItems` is one
   * of them. The first version of this stub accepted the assignment happily,
   * so the tests passed while the shipped app set `menuItems` before
   * attaching, threw, and fell back to the plain box on every question. A
   * stub that is more permissive than the real thing tests nothing.
   */
  class StubMathField extends HTMLElement {
    value = "";
    mathVirtualKeyboardPolicy = "auto";
    smartMode = false;
    readonly = false;
    executeCommand = executeCommand;

    #menuItems: unknown[] = [];

    get menuItems() {
      return this.#menuItems;
    }

    set menuItems(items: unknown[]) {
      if (!this.isConnected) throw new Error("Mathfield not mounted");
      this.#menuItems = items;
    }
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

  /**
   * The field has to be in the document before it is configured. Getting this
   * backwards does not look like a crash - it looks like the field never
   * loading, because the failure lands in the same catch as a failed download.
   */
  it("attaches the field before configuring it", async () => {
    await renderReady();
    const mounted = field()!;
    expect(mounted.isConnected).toBe(true);
    expect((mounted as unknown as { menuItems: unknown[] }).menuItems).toEqual(
      [],
    );
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

  /**
   * Enter has two jobs in this app: submit the answer, then move to the next
   * question. The field owns the first and the runner owns the second, and the
   * field swallowing both meant that after answering, Enter did nothing at all
   * - in an app whose premise is that your hands stay on the keyboard.
   */
  describe("the Enter key", () => {
    function fireEnter(element: Element) {
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
      return event;
    }

    it("submits while the question is open", async () => {
      const onSubmit = vi.fn();
      render(<Harness onSubmit={onSubmit} />);
      await waitFor(() => expect(field()).toBeTruthy());

      fireEnter(field()!);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("stops there, so the runner does not also advance", async () => {
      render(<Harness />);
      await waitFor(() => expect(field()).toBeTruthy());

      const seenAtWindow = vi.fn();
      window.addEventListener("keydown", seenAtWindow);
      fireEnter(field()!);
      window.removeEventListener("keydown", seenAtWindow);

      expect(seenAtWindow).not.toHaveBeenCalled();
    });

    it("passes through once answered, so the runner can move on", async () => {
      const onSubmit = vi.fn();
      render(
        <NextIntlClientProvider locale="th" messages={messages}>
          <AnswerInput
            value="2"
            onChange={() => {}}
            onSubmit={onSubmit}
            disabled
            state="correct"
          />
        </NextIntlClientProvider>,
      );
      await waitFor(() =>
        expect(
          (field() as unknown as { readonly: boolean } | null)?.readonly,
        ).toBe(true),
      );

      const seenAtWindow = vi.fn();
      window.addEventListener("keydown", seenAtWindow);
      fireEnter(field()!);
      window.removeEventListener("keydown", seenAtWindow);

      expect(onSubmit).not.toHaveBeenCalled();
      expect(seenAtWindow).toHaveBeenCalledTimes(1);
    });
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
