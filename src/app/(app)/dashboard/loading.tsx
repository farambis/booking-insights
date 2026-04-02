function Skeleton({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-neutral-200 ${className}`} />
  );
}

export default function DashboardLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      {/* Chart row skeleton */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Skeleton className="h-64 lg:col-span-3" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>

      {/* Activity chart skeleton */}
      <Skeleton className="mt-6 h-72" />

      {/* Table skeleton */}
      <Skeleton className="mt-6 h-64" />
    </div>
  );
}
