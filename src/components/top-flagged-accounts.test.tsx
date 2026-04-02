import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopFlaggedAccounts } from "./top-flagged-accounts";

const accounts = [
  { account: "060000", accountName: "Gehaelter", flagCount: 5 },
  { account: "070000", accountName: "Miete", flagCount: 3 },
  { account: "050000", accountName: null, flagCount: 2 },
];

describe("TopFlaggedAccounts", () => {
  it("renders all accounts", () => {
    render(<TopFlaggedAccounts accounts={accounts} />);
    expect(screen.getByText(/060000/)).toBeInTheDocument();
    expect(screen.getByText(/070000/)).toBeInTheDocument();
    expect(screen.getByText(/050000/)).toBeInTheDocument();
  });

  it("renders account names when available", () => {
    render(<TopFlaggedAccounts accounts={accounts} />);
    expect(screen.getByText(/Gehaelter/)).toBeInTheDocument();
    expect(screen.getByText(/Miete/)).toBeInTheDocument();
  });

  it("renders flag counts", () => {
    render(<TopFlaggedAccounts accounts={accounts} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("links to bookings filtered by account", () => {
    render(<TopFlaggedAccounts accounts={accounts} />);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/bookings?account=060000");
    expect(links[1]).toHaveAttribute("href", "/bookings?account=070000");
    expect(links[2]).toHaveAttribute("href", "/bookings?account=050000");
  });

  it("renders section heading", () => {
    render(<TopFlaggedAccounts accounts={accounts} />);
    expect(screen.getByText("Top Flagged Accounts")).toBeInTheDocument();
  });
});
