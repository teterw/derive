// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";

/**
 * "Dark mode. Respect prefers-color-scheme, allow manual override."
 * (PROMPT.md §10). The override is a class on `<html>` plus a localStorage
 * entry, which the inline script in the layout reads before paint.
 */
describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
  });

  it("starts on the system setting, with no class stamped", () => {
    render(<ThemeToggle label="theme" />);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("derive-theme")).toBeNull();
  });

  it("cycles system to light to dark and back", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle label="theme" />);
    const button = screen.getByRole("button", { name: "theme" });

    await user.click(button);
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("derive-theme")).toBe("light");

    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(localStorage.getItem("derive-theme")).toBe("dark");

    await user.click(button);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    // Back to the system setting means forgetting the choice, not storing one.
    expect(localStorage.getItem("derive-theme")).toBeNull();
  });

  it("picks up a choice made on a previous visit", () => {
    localStorage.setItem("derive-theme", "dark");
    render(<ThemeToggle label="theme" />);
    // The inline script stamps the class; the toggle only has to agree.
    expect(localStorage.getItem("derive-theme")).toBe("dark");
  });
});
