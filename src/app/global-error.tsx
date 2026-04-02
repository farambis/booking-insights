"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body className="flex min-h-full flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <button
          onClick={reset}
          className="rounded-full bg-black px-5 py-2 text-white transition-colors hover:bg-[#383838]"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
