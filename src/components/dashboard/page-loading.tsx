/** Shown the moment a dashboard link is tapped, while the next page loads. */
export function PageLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-border" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded bg-border/70" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />)}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
