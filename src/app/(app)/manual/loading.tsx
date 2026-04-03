function Skeleton({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className}`} />
  );
}

export default function ManualLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Rule card skeletons */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}
