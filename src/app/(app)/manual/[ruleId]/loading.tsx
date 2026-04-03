function Skeleton({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className}`} />
  );
}

export default function RuleViolationsLoading() {
  return (
    <div>
      {/* Back link skeleton */}
      <Skeleton className="mb-4 h-4 w-32" />

      {/* Header skeleton */}
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <Skeleton className="h-7 w-80" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      {/* Description skeleton */}
      <Skeleton className="mb-6 h-4 w-96" />

      {/* Table skeleton */}
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
