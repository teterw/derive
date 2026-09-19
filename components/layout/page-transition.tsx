"use client";

import { usePathname } from "@/i18n/navigation";

/**
 * Fades page content in when the route changes.
 *
 * Navigation swapped one page for another in a single frame, which reads as a
 * glitch rather than as a change - there is nothing to tell the eye that
 * something deliberate happened, so it looks like the screen broke and
 * recovered. A short fade is enough to turn a cut into a transition.
 *
 * Deliberately small: 160ms and four pixels. This is a study app, and someone
 * doing forty questions in a sitting will cross this animation constantly. Any
 * longer and it becomes something to wait through.
 *
 * ## Why `key`
 *
 * Changing the key remounts the subtree, which replays the CSS animation. The
 * alternative - toggling a class in an effect - has to guess when the new page
 * has painted and gets it wrong on a slow one.
 *
 * `usePathname` here is locale-stripped and carries no query string, which
 * matters more than it looks: the practice runner rewrites `?q=` on every
 * question. Keying on the full URL would remount the runner mid-session and
 * throw away the question being answered.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
