interface EmptyStateProps {
  heading: string;
  subtext?: string;
  children?: React.ReactNode;
}

export function EmptyState({ heading, subtext, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-neutral-900">{heading}</h2>
      {subtext && (
        <p className="mt-1 max-w-sm text-sm text-neutral-500">{subtext}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
