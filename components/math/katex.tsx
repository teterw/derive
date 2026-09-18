import katex from "katex";
import { cn } from "@/lib/utils";

/**
 * Renders KaTeX to HTML. Named `Tex` rather than `Math` so it does not shadow
 * the global `Math` object in files that need both.
 *
 * Rendered on the server wherever possible. No client JavaScript is needed to see
 * the maths, which matters on a phone on a school connection.
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
    output: "html",
  });

  return (
    <span
      className={cn(display ? "block text-center" : "inline-block", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
