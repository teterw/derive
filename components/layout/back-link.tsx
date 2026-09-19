import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * The way out of a page that you went into.
 *
 * It is a link to the parent, not `history.back()`, and that is deliberate.
 * Browser history inside a practice run is a trail of question states - the
 * runner rewrites `?q=` for every question - so going back one entry lands you
 * on the previous question of a run you were trying to leave. A declared parent
 * always goes where the arrow appears to point, renders on the server, and
 * works with JavaScript off.
 *
 * Only pages you can be *inside* get one. On a top-level destination the arrow
 * would either do nothing or take you out of the app, and an arrow that
 * sometimes leaves the site is worse than no arrow.
 */
export function BackLink({
  href,
  label,
}: {
  /** Locale-relative, e.g. `/learn`. */
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group -ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <ArrowLeft
        className="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        aria-hidden
      />
      {label}
    </Link>
  );
}
