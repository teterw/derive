// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";

/**
 * "Dark mode. Respect prefers-color-scheme, allow manual override."
 * (PROMPT.md §10). The override is a class on `<html>` plus a localStorage
 * entry, which the inline script in the layout reads before paint.
 *
 * The toggle is two-state. "System" is still the starting point for an account
 * that has never chosen - no class, media query decides - but it is no longer
 * a place the button can put you, so the first press always lands on the
 * opposite of what is on screen.
 */

/** jsdom has no `matchMedia`; these tests need to control what it answers. */
function systemPrefers(scheme: "light" | "dark") {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: query.includes("dark") && scheme === "dark",
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
    systemPrefers("light");
  });

  it("stamps no class until a choice is made", () => {
    render(<ThemeToggle label="theme" />);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("derive-theme")).toBeNull();
  });

  it("flips between the two, and only the two", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle label="theme" />);
    const button = screen.getByRole("button", { name: "theme" });

    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("derive-theme")).toBe("dark");

    await user.click(button);
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("derive-theme")).toBe("light");

    /*
     * The third press is the one that used to land on "system" and forget the
     * choice. It must now go back to dark and keep it.
     */
    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("derive-theme")).toBe("dark");
  });

  /**
   * With nothing stored the button reflects what the *system* resolved to, so
   * one press has to leave the theme the learner is looking at rather than
   * re-selecting it.
   */
  it("first press leaves an inherited dark theme", async () => {
    systemPrefers("dark");
    const user = userEvent.setup();
    render(<ThemeToggle label="theme" />);

    await user.click(screen.getByRole("button", { name: "theme" }));
    expect(localStorage.getItem("derive-theme")).toBe("light");
  });

  it("picks up a choice made on a previous visit", async () => {
    localStorage.setItem("derive-theme", "dark");
    const user = userEvent.setup();
    render(<ThemeToggle label="theme" />);

    await user.click(screen.getByRole("button", { name: "theme" }));
    expect(localStorage.getItem("derive-theme")).toBe("light");
  });
});
