// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/th.json";

const replace = vi.fn();
let pathname = "/practice/run";
let search = "";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
}));

const { LocaleSwitch } = await import("./locale-switch");

function renderSwitch(locale: "th" | "en" = "th") {
  render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleSwitch />
    </NextIntlClientProvider>,
  );
}

describe("LocaleSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = "/practice/run";
    search = "";
  });

  it("marks the language you are already reading", () => {
    renderSwitch("th");
    expect(screen.getByRole("button", { name: "ไทย" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("button", { name: "EN" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  /**
   * "Switching preserves the current question and page" (PROMPT.md §10). The
   * question lives in the query string, so the query has to come along.
   */
  it("stays on the same page, query and all", async () => {
    search = "skills=quad.formula&q=quad.formula-core%3A42%3A2";
    const user = userEvent.setup();
    renderSwitch("th");

    await user.click(screen.getByRole("button", { name: "EN" }));

    expect(replace).toHaveBeenCalledTimes(1);
    const [href, options] = replace.mock.calls[0]!;
    expect(options).toEqual({ locale: "en" });
    expect(href).toContain("/practice/run?");
    expect(href).toContain("skills=quad.formula");
    expect(href).toContain("q=quad.formula-core");
  });

  it("leaves a bare path bare", async () => {
    const user = userEvent.setup();
    renderSwitch("th");

    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(replace).toHaveBeenCalledWith("/practice/run", { locale: "en" });
  });

  it("does nothing when you pick the language you are on", async () => {
    const user = userEvent.setup();
    renderSwitch("th");

    await user.click(screen.getByRole("button", { name: "ไทย" }));
    expect(replace).not.toHaveBeenCalled();
  });
});
