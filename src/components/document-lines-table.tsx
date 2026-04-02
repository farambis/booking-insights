import type { DocumentLine } from "@/lib/bookings/booking.types";
import { formatAmount } from "@/lib/bookings/format";

interface DocumentLinesTableProps {
  lines: DocumentLine[];
  documentId: string;
}

export function DocumentLinesTable({
  lines,
  documentId,
}: DocumentLinesTableProps) {
  const totalDebit = lines
    .filter((l) => l.debitCredit === "S")
    .reduce((sum, l) => sum + l.amount, 0);
  const totalCredit = lines
    .filter((l) => l.debitCredit === "H")
    .reduce((sum, l) => sum + l.amount, 0);
  const balance = Math.abs(totalDebit - totalCredit);
  // Round to avoid floating point artifacts
  const roundedBalance = Math.round(balance * 100) / 100;
  const isBalanced = roundedBalance === 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Document Lines
        </h3>
        <p className="text-xs text-neutral-500">
          All lines belonging to document {documentId}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium tracking-wide text-neutral-500 uppercase">
              <th className="px-4 py-2">Line</th>
              <th className="px-4 py-2">GL Account</th>
              <th className="px-4 py-2">S/H</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Cost Center</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.lineId} className="border-b border-neutral-100">
                <td className="px-4 py-2 font-mono text-xs">{line.lineId}</td>
                <td className="px-4 py-2">
                  <span className="font-mono">{line.glAccount}</span>
                  {line.glAccountName && (
                    <span className="ml-1 text-neutral-500">
                      {line.glAccountName}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 font-medium">{line.debitCredit}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {formatAmount(line.amount)}
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {line.costCenter ?? "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 bg-neutral-50">
              <td colSpan={3} className="px-4 py-2 text-xs font-medium">
                Balance
              </td>
              <td
                className={`px-4 py-2 text-right text-xs font-medium tabular-nums ${
                  isBalanced ? "text-clean" : "text-critical"
                }`}
              >
                {formatAmount(roundedBalance)}
                {isBalanced ? " \u2713" : ""}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
