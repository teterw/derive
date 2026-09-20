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
 * ## The bar
 *
 * A shut chapter has to be worth reading shut, or it is just a door. `12/20`
 * is a fact you have to do arithmetic on; the bar under it is the same fact at
 * a glance, and twenty of them down the page is a shape - where you are, what
 * you have finished, what you have not started. The number stays for anyone
 * who wants the exact figure.
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
 * The opening and shutting is animated in `globals.css`, next to the rest of
 * the motion, because it is done with `::details-content` rather than here.
 */
export function Chapter({
  id,
  title,
  meta,
  done,
  total,
  trailing,
  dense = false,
  open = false,
  children,
}: {
  /** The anchor `StageJump` points at. */
  id?: string;
  title: string;
  meta: string;
  /** How many of the chapter's skills count as done, for the bar and the figure. */
  done?: number;
  total?: number;
  /** Replaces the bar and figure. The exam uses it: a paper is not about your progress. */
  trailing?: React.ReactNode;
  /**
   * Smaller type and tighter padding, for a page that puts these in a grid
   * rather than a column. See `/exam`.
   */
  dense?: boolean;
  open?: boolean;
  children: React.ReactNode;
}) {
  const hasCount =
    trailing === undefined &&
    done !== undefined &&
    total !== undefined &&
    total > 0;
  const fraction = hasCount ? done! / total! : 0;

  /*
   * A *named* group. The rows inside these panels carry their own `group` for
   * their hover state, and an unnamed group here would be an ancestor of every
   * one of them - so hovering the chapter anywhere would light up all twenty
   * lesson rows at once.
   */
  return (
    <details
      id={id}
      open={open}
      className={cn(
        "group/chapter scroll-mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-sm",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-accent/40 hover:shadow-md",
      )}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3",
          dense ? "px-4 py-3" : "px-6 py-4",
          "transition-colors duration-200 hover:bg-surface-2",
          // Safari draws its own triangle without this.
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <ChevronRight
          className="size-4 shrink-0 text-muted transition-transform duration-200 group-open/chapter:rotate-90"
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate font-semibold tracking-tight",
              dense ? "text-sm" : "text-lg",
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              "block truncate text-muted",
              dense ? "text-xs" : "text-sm",
            )}
          >
            {meta}
          </span>
        </span>

        {trailing}

        {hasCount ? (
          <span className="flex shrink-0 items-center gap-2.5">
            <span
              className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2"
              aria-hidden
            >
              <span
                className={cn(
                  "block h-full rounded-full transition-[width] duration-300",
                  fraction === 1 ? "bg-correct" : "bg-accent",
                )}
                style={{ width: `${Math.round(fraction * 100)}%` }}
              />
            </span>
            <span className="w-10 text-right font-mono text-xs tabular-nums text-muted">
              {done}/{total}
            </span>
          </span>
        ) : null}
      </summary>

      <div
        className={cn(
          "border-t border-border",
          dense ? "px-4 pb-4 pt-3" : "px-6 pb-6 pt-4",
        )}
      >
        {children}
      </div>
    </details>
  );
}
