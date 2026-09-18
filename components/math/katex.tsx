import katex from "katex";
import { cn } from "@/lib/utils";

/**
 * Renders KaTeX. Named `Tex` rather than `Math` so it does not shadow the
 * global `Math` object in files that need both.
 *
 * Rendered on the server wherever possible: no client JavaScript is needed to
 * see the maths, which matters on a phone on a school connection.
 *
 * Output is KaTeX's default HTML *and* MathML. The MathML is what a screen
 * reader reads and what a copy-paste carries, so a formula is not a picture -
 * dropping it would save a few bytes and lose the maths for anyone not looking
 * at the screen.
 *
 * `throwOnError: false` renders a red fragment instead of blowing up the page;
 * the property tests are what stop a broken fragment reaching here in the
 * first place.
 */
export function Tex({
  tex,
  display = false,
  className,
}: {
  tex: string;
  display?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    strict: false,
    trust: false,
  });

  return (
    <span
      className={cn(display ? "block text-center" : "inline-block", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
