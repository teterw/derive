/**
 * A calm placeholder while a page's queries run. No spinner: a spinner on a
 * page that usually takes 200ms reads as something being wrong.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse px-4 py-8">
      <div className="h-8 w-48 rounded bg-surface-2" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-24 rounded-xl bg-surface-2" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-xl bg-surface-2" />
    </div>
  );
}
