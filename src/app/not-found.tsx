import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Not yet built
      </h1>
      <p className="max-w-sm text-sm text-neutral-500">
        This page doesn&apos;t exist yet. Booking Insights is under active
        development.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
