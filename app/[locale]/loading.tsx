/**
 * The placeholder while a page's queries run.
 *
 * It used to be dashboard-shaped - a title over a three-up grid of stat tiles
 * over a big panel - and it was shown for every route in the app. On the rules
 * list, the people list or a lesson it was a picture of a different page
 * entirely, flashing for a couple of hundred milliseconds before being
 * replaced by something with a completely different shape. That flash is what
 * made navigation look unfinished.
 *
 * So it now shows only what every page genuinely has: a heading, a line under
 * it, and a body. It is honest at any route, which means it can fade into the
 * real thing rather than being swapped out for it.
 *
 * No spinner: a spinner on something that usually takes 200ms reads as
 * something being wrong.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8" aria-hidden>
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-md bg-surface-2" />
          <div className="h-4 w-64 rounded bg-surface-2/70" />
        </div>
        <div className="h-64 rounded-xl bg-surface-2/60" />
      </div>
    </div>
  );
}
