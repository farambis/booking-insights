"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-neutral-500">
        An unexpected error occurred. Your data has not been affected.
      </p>
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={reset}
          className="bg-brand hover:bg-brand-dim rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
