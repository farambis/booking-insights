import Link from "next/link";

interface TopFlaggedAccountsProps {
  accounts: {
    account: string;
    accountName: string | null;
    flagCount: number;
  }[];
}

export function TopFlaggedAccounts({ accounts }: TopFlaggedAccountsProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-900">
        Top Flagged Accounts
      </h2>
      <ul className="mt-3 space-y-2">
        {accounts.map((account, index) => (
          <li key={account.account}>
            <Link
              href={`/bookings?account=${account.account}`}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100"
            >
              <span className="text-neutral-700">
                <span className="font-medium text-neutral-500">
                  {index + 1}.
                </span>{" "}
                <span className="font-mono">{account.account}</span>
                {account.accountName && (
                  <span className="ml-1 text-neutral-500">
                    {account.accountName}
                  </span>
                )}
              </span>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {account.flagCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
