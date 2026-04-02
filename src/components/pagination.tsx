import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  prevUrl: string | null;
  nextUrl: string | null;
}

export function Pagination({
  currentPage,
  totalPages,
  prevUrl,
  nextUrl,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buttonBase =
    "rounded border border-neutral-200 px-3 py-1.5 text-sm font-medium transition-colors";

  return (
    <div className="flex items-center justify-center gap-4 pt-4">
      {prevUrl ? (
        <Link
          href={prevUrl}
          className={`${buttonBase} text-neutral-700 hover:bg-neutral-50`}
        >
          Previous
        </Link>
      ) : (
        <span
          className={`${buttonBase} cursor-not-allowed text-neutral-700 opacity-40`}
        >
          Previous
        </span>
      )}
      <span className="text-sm text-neutral-500">
        Page {currentPage} of {totalPages}
      </span>
      {nextUrl ? (
        <Link
          href={nextUrl}
          className={`${buttonBase} text-neutral-700 hover:bg-neutral-50`}
        >
          Next
        </Link>
      ) : (
        <span
          className={`${buttonBase} cursor-not-allowed text-neutral-700 opacity-40`}
        >
          Next
        </span>
      )}
    </div>
  );
}
