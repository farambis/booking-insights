function SkeletonBar({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
  );
}

export default function BookingsLoading() {
  return (
    <div>
      {/* Page header skeleton */}
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <SkeletonBar className="mb-2 h-7 w-40" />
        <SkeletonBar className="h-4 w-64" />
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-4 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex gap-3">
          <SkeletonBar className="h-9 w-80" />
          <SkeletonBar className="h-9 w-48" />
        </div>
        <div className="mt-3 flex gap-3">
          <SkeletonBar className="h-8 w-16" />
          <SkeletonBar className="h-8 w-20" />
          <SkeletonBar className="h-8 w-20" />
          <SkeletonBar className="h-8 w-16" />
        </div>
      </div>

      {/* Results summary skeleton */}
      <SkeletonBar className="mb-2 h-4 w-48" />

      {/* Table skeleton */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        {/* Header */}
        <div className="flex gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <SkeletonBar className="h-4 w-10" />
          <SkeletonBar className="h-4 w-20" />
          <SkeletonBar className="h-4 w-20" />
          <SkeletonBar className="h-4 w-40" />
          <SkeletonBar className="h-4 w-20" />
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="h-4 w-16" />
        </div>
        {/* 7 skeleton rows */}
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-neutral-100 px-4 py-3"
          >
            <SkeletonBar className="h-4 w-10" />
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-4 w-40" />
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
