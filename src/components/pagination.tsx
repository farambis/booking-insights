import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  prevUrl: string | null;
  nextUrl: string | null;
  currentPageSize: number;
  pageSizeOptions: readonly number[];
  pageSizeUrls: Record<number, string>;
}

export function Pagination({
  currentPage,
  totalPages,
  prevUrl,
  nextUrl,
  currentPageSize,
  pageSizeOptions,
  pageSizeUrls,
}: PaginationProps) {
  if (totalPages <= 1 && pageSizeOptions.length <= 1) return null;

  const buttonBase =
    "rounded border border-neutral-200 px-3 py-1.5 text-sm font-medium transition-colors";

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-500">Rows per page:</span>
        {pageSizeOptions.map((size) => (
          <Link
            key={size}
            href={pageSizeUrls[size]}
            className={`rounded border px-2 py-1 text-sm font-medium transition-colors ${
              size === currentPageSize
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            {size}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
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
    </div>
  );
}
