"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  BarChart3,
  Globe,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The menu behind your own face.
 *
 * The header had grown a row of single-purpose icons - avatar, level, locale,
 * theme, sign out - and the ones that belong to *your account* rather than to
 * the app were mixed in with the ones that do not. These five are the account
 * ones, so they live together, behind the thing that already means "you".
 *
 * ## Hover, but not only hover
 *
 * It opens on hover, which is what makes it feel quick on a laptop, and that
 * is the whole of the behaviour on a great many sites - which is why those
 * sites are unusable on a phone and unreachable by keyboard. So hover is the
 * shortcut, not the mechanism:
 *
 *   - **click** toggles it, which is what a touch device sends;
 *   - **Escape** shuts it and puts focus back on the button;
 *   - **focus moving inside** keeps it open, so it can be tabbed through;
 *   - **focus leaving** shuts it, so it cannot be left hanging open behind you.
 *
 * The close on pointer-leave is delayed. Without the delay, a pointer taking
 * the diagonal from the button to the third item clips the corner and the menu
 * vanishes underneath it.
 */

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** How long the pointer may be outside before it shuts. */
const LEAVE_GRACE_MS = 140;

export function ProfileMenu({
  username,
  displayName,
  label,
  labels,
  avatar,
  signOut,
}: {
  username: string;
  displayName: string;
  /** Accessible name for the trigger. */
  label: string;
  labels: {
    stats: string;
    people: string;
    profile: string;
    settings: string;
  };
  avatar: React.ReactNode;
  /** The sign-out form, rendered by the server so the action stays server-side. */
  signOut: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };

  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), LEAVE_GRACE_MS);
  };

  useEffect(() => cancelClose, []);

  /*
   * A click anywhere else shuts it. Without this, opening the menu and then
   * clicking the page behind it leaves the menu sitting there over content it
   * has nothing to do with.
   */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const items: Item[] = [
    { href: "/stats", label: labels.stats, icon: BarChart3 },
    { href: "/people", label: labels.people, icon: Users },
    { href: `/u/${username}`, label: labels.profile, icon: Globe },
    { href: "/settings", label: labels.settings, icon: Settings },
  ];

  return (
    <div
      ref={wrapper}
      className="relative"
      onPointerEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onPointerLeave={closeSoon}
      onFocus={cancelClose}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        setOpen(false);
        trigger.current?.focus();
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        onClick={() => setOpen((was) => !was)}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-full p-0.5 pr-2",
          "transition-colors hover:bg-surface-2",
          open && "bg-surface-2",
        )}
      >
        {avatar}
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
          {displayName}
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          /*
           * `top-full` with no gap: a menu that floats a few pixels clear of
           * its trigger opens and then shuts as the pointer crosses the space
           * between them. The padding inside does the visual separating.
           */
          className={cn(
            "absolute right-0 top-full z-50 min-w-56 pt-2",
            "motion-safe:animate-[page-enter_140ms_ease-out_both]",
          )}
        >
          <div className="overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-lg">
            {items.map(({ href, label: text, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-surface-2 hover:text-accent focus-visible:bg-surface-2 focus-visible:text-accent"
              >
                <Icon className="size-4 shrink-0 text-muted" aria-hidden />
                {text}
              </Link>
            ))}

            <div className="my-1.5 border-t border-border" />
            {signOut}
          </div>
        </div>
      ) : null}
    </div>
  );
}
