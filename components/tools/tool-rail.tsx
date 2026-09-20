"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The tools, docked beside the question instead of on top of it.
 *
 * On a laptop there is room for both, and the panels used to spend it badly:
 * a slide-over covered the question, so checking a formula meant losing sight
 * of the thing you were checking it against, and only one tool could be open
 * at a time. Working a question with the calculator *and* the formula sheet -
 * which is how anyone actually works a question - was two panels of shuffling.
 *
 * So above `lg` the panels are a real column at the right-hand edge and the
 * page is made narrower to fit, rather than sliding underneath them. Below
 * that there is no room for a column and it stays a bottom sheet, one at a
 * time - see `SlideOver`.
 *
 * ## Making room
 *
 * The rail is `position: fixed`, so it cannot push anything on its own. It
 * publishes its width as `--tool-rail` on the document element and a rule in
 * `globals.css` pads the body by it above `lg`. Everything inside - header,
 * nav strip, `main` and its centred column - reflows into what is left, and
 * the floating dock buttons, which are fixed too, read the same variable to
 * stay at the rail's left edge.
 *
 * Capped at `45vw` so a wide panel on a 1024px laptop still leaves the
 * majority of the screen to the maths, which is the thing being studied.
 */
export type RailPanel = {
  tool: string;
  title: string;
  /** The graph wants more room than a list of formulas does. */
  wide?: boolean;
  content: React.ReactNode;
};

const NARROW_REM = 24;
const WIDE_REM = 36;

export function ToolRail({
  panels,
  onClose,
  closeLabel,
}: {
  panels: RailPanel[];
  onClose: (tool: string) => void;
  closeLabel: string;
}) {
  const width = panels.some((panel) => panel.wide) ? WIDE_REM : NARROW_REM;
  const open = panels.length > 0;
  const size = `min(${width}rem, 45vw)`;

  useEffect(() => {
    const root = document.documentElement;
    if (!open) {
      root.style.removeProperty("--tool-rail");
      return;
    }
    root.style.setProperty("--tool-rail", size);
    return () => {
      root.style.removeProperty("--tool-rail");
    };
  }, [open, size]);

  if (!open) return null;

  return (
    /*
     * Its own width is inline rather than read back from `--tool-rail`: the
     * variable is published in an effect, which runs after the browser has
     * already painted this element once.
     */
    <aside
      aria-label={panels.map((panel) => panel.title).join(", ")}
      style={{ width: size }}
      className="fixed inset-y-0 right-0 z-30 flex flex-col overflow-hidden border-l border-border bg-surface"
    >
      {panels.map((panel) => (
        /*
         * Equal shares of the height, each scrolling its own body. Two panels
         * is the case this was built for and 50/50 suits it: the keypad fits
         * in half a laptop screen with room for the working, and the formula
         * sheet was always going to scroll whatever it was given.
         */
        <section
          key={panel.tool}
          aria-label={panel.title}
          className="flex min-h-0 flex-1 flex-col border-b border-border last:border-b-0"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-medium">{panel.title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClose(panel.tool)}
              aria-label={`${closeLabel} ${panel.title}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {panel.content}
          </div>
        </section>
      ))}
    </aside>
  );
}
