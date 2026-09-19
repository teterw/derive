"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * A navigation link that knows whether you are looking at it.
 *
 * Without this the three navigation surfaces all looked identical on every
 * page, so the only way to know where you were was to read the heading. That
 * is a small tax on someone who knows the app and a real obstacle to someone
 * who does not.
 *
 * One signal, the accent, expressed differently per surface - a bar in the
 * header, a filled pill in the strip, a coloured icon in the tab bar - rather
 * than three unrelated treatments. And `aria-current="page"` regardless, which
 * is the half that colour cannot carry: a screen reader announces it, and
 * anyone who cannot separate the accent from the muted grey gets told rather
 * than shown.
 */

export type NavVariant = "header" | "strip" | "tab" | "avatar";

/**
 * Whether `href` is the page being looked at.
 *
 * A section link stays lit for its children - `/practice` is still the current
 * place while you are at `/practice/run`, and `/rules` while reading one rule.
 * The dashboard is the exception: as `/` it is a prefix of everything, so it
 * only matches exactly.
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({
  href,
  variant,
  className,
  title,
  "aria-label": ariaLabel,
  children,
}: {
  href: string;
  variant: NavVariant;
  className?: string;
  title?: string;
  "aria-label"?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      title={title}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={cn(
        "transition-colors",
        variant === "header" &&
          cn(
            // The bar sits on the header's lower edge, nearest the content it
            // belongs to.
            "relative rounded px-2 py-1",
            active
              ? "text-fg after:absolute after:inset-x-2 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-accent"
              : "text-muted hover:bg-surface-2 hover:text-fg",
          ),
        variant === "strip" &&
          cn(
            "shrink-0 rounded px-2 py-1",
            active
              ? "bg-accent/10 text-accent"
              : "text-muted hover:bg-surface-2 hover:text-fg",
          ),
        variant === "tab" &&
          cn(
            // Mirrors the header: a bar on the edge nearest the content, which
            // on a bottom bar is the top one.
            "relative flex flex-col items-center gap-0.5 py-2 text-[10px]",
            active
              ? "text-accent before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:rounded-full before:bg-accent"
              : "text-muted active:text-accent",
          ),
        variant === "avatar" &&
          cn(
            "block shrink-0 rounded-full ring-offset-2 ring-offset-bg",
            active ? "ring-2 ring-accent" : "hover:ring-2 hover:ring-border",
          ),
        className,
      )}
    >
      {children}
    </Link>
  );
}
