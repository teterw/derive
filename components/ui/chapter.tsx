import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A chapter that opens and shuts.
 *
 * Twenty chapters of content turned every list page into ten screens. `/learn`
 * measured 9,036 pixels and seventy-eight rendered formulas, and Calculus I -
 * the part of the app a university learner actually came for - sat in the last
 * third of it. The same was true of the practice and exam setup pages. Nobody
 * scrolls that far to find out what is there; they assume it is not.
 *
 * Shut, the same page is 2,417 pixels. The twenty headings become the page's
 * own index, and the chapter you want is a click rather than a scroll. What is
 * open on arrival is the work in progress - see each page for its own rule -
 * because the commonest reason to be here is to carry on.
 *
 * ## Why `<details>` and not state
 *
 * It is native, so it needs no JavaScript, keeps working on the setup pages
 * that are deliberately plain GET forms, and is keyboard- and
 * screen-reader-operable without any of that being written here. A shut
 * `<details>` is still in the DOM, which is the property the setup pages need:
 * a skill ticked in a chapter you then shut still submits with the form.
 *
 * That last point cuts both ways and is worth being honest about. The markup
 * still ships - `/learn` is 61KB either way, and all seventy-eight formulas
 * are still rendered by KaTeX on the server and still laid out by the browser
 * (checked: a shut chapter's content reports `content-visibility: visible` and
 * a real box). Nothing here makes the page cheaper to build. What it changes
 * is how much of it you have to walk past, and that was the complaint.
 *
 * The summary carries a count as well as a name, because a heading you have to
 * open to learn anything from is a heading that has to be opened twenty times.
 */
export function Chapter({
  id,
  title,
  meta,
  count,
  open = false,
  children,
}: {
  /** The anchor `StageJump` points at. */
  id?: string;
  title: string;
  meta: string;
  /** The right-hand figure - lessons passed, skills ticked, whatever the page is about. */
  count?: React.ReactNode;
  open?: boolean;
  children: React.ReactNode;
}) {
  /*
   * A *named* group below. The rows inside these panels carry their own
   * `group` for their hover state, and an unnamed group here would be an
   * ancestor of every one of them - so hovering the chapter anywhere would
   * light up all twenty lesson rows at once.
   */
  return (
    <details
      id={id}
      open={open}
      className="group/chapter scroll-mt-6 rounded-xl border border-border bg-surface shadow-sm"
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 rounded-xl px-6 py-4",
          "hover:bg-surface-2 group-open/chapter:rounded-b-none",
          // Safari draws its own triangle without this.
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <ChevronRight
          className="size-4 shrink-0 text-muted transition-transform group-open/chapter:rotate-90"
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold tracking-tight">
            {title}
          </span>
          <span className="block truncate text-sm text-muted">{meta}</span>
        </span>
        {count === undefined ? null : (
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
            {count}
          </span>
        )}
      </summary>

      <div className="border-t border-border px-6 pb-6 pt-4">{children}</div>
    </details>
  );
}
