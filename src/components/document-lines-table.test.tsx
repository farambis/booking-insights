import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DocumentLinesTable } from "./document-lines-table";
import type { DocumentLine } from "@/lib/bookings/booking.types";

const balancedLines: DocumentLine[] = [
  {
    lineId: 1,
    glAccount: "060000",
    glAccountName: "Gehälter",
    amount: 1000.0,
    debitCredit: "S",
    costCenter: "3000",
  },
  {
    lineId: 2,
    glAccount: "030000",
    glAccountName: "Verbindlichkeiten aus Lieferungen und Leistungen",
    amount: 800.0,
    debitCredit: "H",
    costCenter: null,
  },
  {
    lineId: 3,
    glAccount: "020200",
    glAccountName: "Vorsteuer",
    amount: 200.0,
    debitCredit: "H",
    costCenter: null,
  },
];

const unbalancedLines: DocumentLine[] = [
  {
    lineId: 1,
    glAccount: "060000",
    glAccountName: "Gehälter",
    amount: 1000.0,
    debitCredit: "S",
    costCenter: null,
  },
  {
    lineId: 2,
    glAccount: "030000",
    glAccountName: "Verbindlichkeiten aus Lieferungen und Leistungen",
    amount: 800.0,
    debitCredit: "H",
    costCenter: null,
  },
];

describe("DocumentLinesTable", () => {
  it("renders all document lines", () => {
    render(
      <DocumentLinesTable lines={balancedLines} documentId="5000000142" />,
    );
    expect(screen.getByText("060000")).toBeInTheDocument();
    expect(screen.getByText("030000")).toBeInTheDocument();
    expect(screen.getByText("020200")).toBeInTheDocument();
  });

  it("renders account names", () => {
    render(
      <DocumentLinesTable lines={balancedLines} documentId="5000000142" />,
    );
    expect(screen.getByText(/Gehälter/)).toBeInTheDocument();
    expect(screen.getByText(/Vorsteuer/)).toBeInTheDocument();
  });

  it("renders debit/credit indicator", () => {
    render(
      <DocumentLinesTable lines={balancedLines} documentId="5000000142" />,
    );
    // 1 debit line (S) and 2 credit lines (H)
    const debitIndicators = screen.getAllByText("S");
    expect(debitIndicators).toHaveLength(1);
    const creditIndicators = screen.getAllByText("H");
    expect(creditIndicators).toHaveLength(2);
  });

  it("renders cost center when present", () => {
    render(
      <DocumentLinesTable lines={balancedLines} documentId="5000000142" />,
    );
    expect(screen.getByText("3000")).toBeInTheDocument();
  });

  it("shows balanced status when debits equal credits", () => {
    render(
      <DocumentLinesTable lines={balancedLines} documentId="5000000142" />,
    );
    // S: 1000.00, H: 800.00 + 200.00 = 1000.00 => balanced
    // The footer cell contains "0,00 EUR" + checkmark
    const footer = screen.getByText(/0,00 EUR.*\u2713/);
    expect(footer).toBeInTheDocument();
  });

  it("shows imbalance when debits do not equal credits", () => {
    render(
      <DocumentLinesTable lines={unbalancedLines} documentId="5000000099" />,
    );
    // S: 1000.00, H: 800.00, diff = 200.00
    expect(screen.getByText(/200,00 EUR/)).toBeInTheDocument();
  });

  it("renders the document heading", () => {
    render(
      <DocumentLinesTable lines={balancedLines} documentId="5000000142" />,
    );
    expect(screen.getByText(/5000000142/)).toBeInTheDocument();
  });
});
