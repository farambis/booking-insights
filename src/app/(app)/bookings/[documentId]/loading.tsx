function SkeletonBar({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
  );
}

export default function BookingDetailLoading() {
  return (
    <div>
      {/* Back link skeleton */}
      <SkeletonBar className="mb-4 h-4 w-32" />

      {/* Header skeleton */}
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <SkeletonBar className="mb-2 h-7 w-80" />
            <SkeletonBar className="h-4 w-24" />
          </div>
          <SkeletonBar className="h-7 w-16" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-3">
          {/* Booking data table skeleton */}
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <SkeletonBar className="h-4 w-24" />
            </div>
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="flex border-b border-neutral-100 px-4 py-2"
              >
                <SkeletonBar className="mr-4 h-4 w-28" />
                <SkeletonBar className="h-4 w-48" />
              </div>
            ))}
          </div>

          {/* Flag cards skeleton */}
          <div className="space-y-3">
            <SkeletonBar className="h-4 w-40" />
            <SkeletonBar className="h-24 w-full" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Related bookings skeleton */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <SkeletonBar className="mb-4 h-4 w-32" />
            <SkeletonBar className="mb-2 h-20 w-full" />
            <SkeletonBar className="mb-2 h-20 w-full" />
          </div>

          {/* Account summary skeleton */}
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <SkeletonBar className="mb-4 h-4 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mb-2 flex justify-between">
                <SkeletonBar className="h-4 w-24" />
                <SkeletonBar className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document lines skeleton */}
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <SkeletonBar className="h-4 w-28" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-b border-neutral-100 px-4 py-2"
          >
            <SkeletonBar className="h-4 w-8" />
            <SkeletonBar className="h-4 w-40" />
            <SkeletonBar className="h-4 w-8" />
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
