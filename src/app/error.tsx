"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <button
        onClick={reset}
        className="bg-foreground text-background rounded-full px-5 py-2 transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Try again
      </button>
    </div>
  );
}
