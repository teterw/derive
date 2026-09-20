// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { isActive, NavLink } from "./nav-link";

let pathname = "/";

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => pathname,
  Link: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("isActive", () => {
  it("lights the page you are on", () => {
    expect(isActive("/practice", "/practice")).toBe(true);
    expect(isActive("/stats", "/stats")).toBe(true);
  });

  /**
   * A section stays lit for its children. Practising at `/practice/run` is
   * still being in Practice, and going dark there would make the indicator
   * disappear exactly when a learner is deepest in the app.
   */
  it("keeps a section lit while you are inside it", () => {
    expect(isActive("/practice/run", "/practice")).toBe(true);
    expect(isActive("/rules/exp.product", "/rules")).toBe(true);
    expect(isActive("/exam/abc-123", "/exam")).toBe(true);
    expect(isActive("/u/teterw", "/u/teterw")).toBe(true);
  });

  /**
   * `/` is a prefix of every path, so prefix matching would light the
   * dashboard permanently. It is the one link that must match exactly.
   */
  it("does not light the dashboard from every other page", () => {
    expect(isActive("/practice", "/")).toBe(false);
    expect(isActive("/stats", "/")).toBe(false);
    expect(isActive("/", "/")).toBe(true);
  });

  /**
   * A prefix has to end at a segment boundary. `/people` must not light
   * `/peop`, and more realistically `/review/run` must not light `/rev`.
   */
  it("only matches at a segment boundary", () => {
    expect(isActive("/people", "/peop")).toBe(false);
    expect(isActive("/practice-extra", "/practice")).toBe(false);
    expect(isActive("/reviewer", "/review")).toBe(false);
  });

  it("does not light a sibling", () => {
    expect(isActive("/practice", "/review")).toBe(false);
    expect(isActive("/u/someone", "/u/teterw")).toBe(false);
  });
});

describe("NavLink", () => {
  /**
   * Colour alone cannot carry this. `aria-current` is what a screen reader
   * announces, and what anyone who cannot separate the accent from the muted
   * grey relies on.
   */
  it("marks the current page for assistive technology", () => {
    pathname = "/practice";
    render(
      <>
        <NavLink href="/practice" variant="header">
          Practice
        </NavLink>
        <NavLink href="/review" variant="header">
          Review
        </NavLink>
      </>,
    );

    expect(screen.getByText("Practice")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Review")).not.toHaveAttribute("aria-current");
  });

  it("marks it on a child route too", () => {
    pathname = "/practice/run";
    render(
      <NavLink href="/practice" variant="tab">
        Practice
      </NavLink>,
    );
    expect(screen.getByText("Practice")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("shows the state visually as well, in every surface", () => {
    for (const variant of ["header", "strip", "tab"] as const) {
      pathname = "/stats";
      const { container, unmount } = render(
        <NavLink href="/stats" variant={variant}>
          Stats
        </NavLink>,
      );
      const link = container.querySelector("a")!;
      expect(link.className, variant).toContain("accent");
      unmount();
    }
  });

  it("leaves an inactive link in the muted styling", () => {
    pathname = "/stats";
    const { container } = render(
      <NavLink href="/practice" variant="header">
        Practice
      </NavLink>,
    );
    expect(container.querySelector("a")!.className).toContain("text-muted");
  });
});
