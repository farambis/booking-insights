interface KpiCardGridProps {
  children: React.ReactNode;
}

export function KpiCardGrid({ children }: KpiCardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>
  );
}
