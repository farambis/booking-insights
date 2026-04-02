"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-neutral-500">
        An unexpected error occurred. Your data has not been affected.
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
