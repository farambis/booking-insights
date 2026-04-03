import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlagExplanationCard } from "./flag-explanation-card";

const criticalFlag = {
  type: "duplicate_booking" as const,
  label: "Duplicate Booking",
  explanation:
    "This booking appears to be a duplicate of 5000000141 (same account, similar amount within 5%, posted within 2 days).",
  confidencePercent: 87,
  relatedDocumentId: "5000000141",
};

const warningFlag = {
  type: "unusual_amount" as const,
  label: "Unusual Amount",
  explanation: "Amount exceeds 2x the account average.",
  confidencePercent: 55,
  relatedDocumentId: null,
};

describe("FlagExplanationCard", () => {
  it("renders the flag type label", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    expect(screen.getByText("Duplicate Booking")).toBeInTheDocument();
  });

  it("renders the explanation text", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    expect(
      screen.getByText(/This booking appears to be a duplicate/),
    ).toBeInTheDocument();
  });

  it("renders confidence as percentage", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    expect(screen.getByText("87%")).toBeInTheDocument();
  });

  it("renders lower confidence as percentage", () => {
    render(<FlagExplanationCard flag={warningFlag} severity="warning" />);
    expect(screen.getByText("55%")).toBeInTheDocument();
  });

  it("applies red color for confidence >= 75%", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    const pct = screen.getByText("87%");
    expect(pct.className).toContain("text-critical");
  });

  it("applies amber color for confidence 50-74%", () => {
    render(<FlagExplanationCard flag={warningFlag} severity="warning" />);
    const pct = screen.getByText("55%");
    expect(pct.className).toContain("text-warning");
  });

  it("applies neutral color for confidence < 50%", () => {
    const lowFlag = { ...warningFlag, confidencePercent: 38 };
    render(<FlagExplanationCard flag={lowFlag} severity="warning" />);
    const pct = screen.getByText("38%");
    expect(pct.className).toContain("text-neutral-500");
  });

  it("renders plain link fallback when no relatedDocument provided", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    const link = screen.getByRole("link", { name: /5000000141/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/bookings/5000000141");
  });

  it("renders inline document card when relatedDocument is provided", () => {
    const relatedDoc = {
      documentId: "5000000141",
      description: "Lieferant Mueller GmbH",
      postingDate: "2025-01-15",
      amount: 1404.17,
      currency: "EUR",
      glAccount: "060000",
      glAccountName: "Gehaelter",
    };
    render(
      <FlagExplanationCard
        flag={criticalFlag}
        severity="critical"
        relatedDocument={relatedDoc}
      />,
    );
    expect(screen.getByText("5000000141")).toBeInTheDocument();
    expect(screen.getByText("Lieferant Mueller GmbH")).toBeInTheDocument();
    expect(screen.getByText("15.01.2025")).toBeInTheDocument();
    expect(screen.getByText(/060000/)).toBeInTheDocument();
    // The inline card should be a link to the related document
    const link = screen.getByRole("link", { name: /5000000141/ });
    expect(link).toHaveAttribute("href", "/bookings/5000000141");
  });

  it("hides plain link when inline document card is shown", () => {
    const relatedDoc = {
      documentId: "5000000141",
      description: "Lieferant Mueller GmbH",
      postingDate: "2025-01-15",
      amount: 1404.17,
      currency: "EUR",
      glAccount: "060000",
      glAccountName: "Gehaelter",
    };
    render(
      <FlagExplanationCard
        flag={criticalFlag}
        severity="critical"
        relatedDocument={relatedDoc}
      />,
    );
    // Should NOT show the plain "Related: 5000000141" text
    expect(screen.queryByText("Related:")).toBeNull();
  });

  it("does not render any link when relatedDocumentId is null", () => {
    render(<FlagExplanationCard flag={warningFlag} severity="warning" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("applies critical severity styling", () => {
    const { container } = render(
      <FlagExplanationCard flag={criticalFlag} severity="critical" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-l-critical");
    expect(card.className).toContain("bg-critical-bg");
  });

  it("applies warning severity styling", () => {
    const { container } = render(
      <FlagExplanationCard flag={warningFlag} severity="warning" />,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-l-warning");
    expect(card.className).toContain("bg-warning-bg");
  });
});
