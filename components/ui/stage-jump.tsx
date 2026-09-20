import { stageAnchors } from "@/content/topics";
import { cn } from "@/lib/utils";

/**
 * Three links to the three places the chapter list begins.
 *
 * Collapsing the chapters took `/learn` from ten screens to two and a half,
 * which is most of the problem but not the part a university learner feels:
 * Calculus I still began below the fold, behind thirteen chapters of school
 * maths they were never going to open. These are plain in-page anchors, so
 * getting there is one click and no scrolling at all.
 *
 * Anchors rather than a filter on purpose. A filter would hide the chapters
 * either side, and the order is the curriculum - seeing that ม.6 calculus sits
 * immediately before Calculus I is worth something, and is lost the moment
 * only one stage is on screen.
 *
 * The chapters carry `scroll-mt-6`, so a jumped-to heading lands with a little
 * air above it rather than flush against the top of the window.
 */
export function StageJump({
  labels,
  className,
}: {
  /** Stage names, in `STAGES` order, from the caller's own namespace. */
  labels: Record<string, string>;
  className?: string;
}) {
  const anchors = stageAnchors();
  if (anchors.length < 2) return null;

  return (
    <nav className={cn("flex flex-wrap gap-2", className)}>
      {anchors.map(({ stage, topicId }) => (
        <a
          key={stage}
          href={`#${topicId}`}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {labels[stage] ?? stage}
        </a>
      ))}
    </nav>
  );
}
