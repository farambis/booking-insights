interface ResultsSummaryProps {
  totalCount: number;
  filteredCount: number;
}

export function ResultsSummary({
  totalCount,
  filteredCount,
}: ResultsSummaryProps) {
  const isFiltered = filteredCount !== totalCount;

  return (
    <p className="mb-2 text-sm text-neutral-500">
      {isFiltered
        ? `Showing ${filteredCount} of ${totalCount} documents`
        : `${totalCount} documents`}
    </p>
  );
}
