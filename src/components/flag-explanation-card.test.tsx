import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlagExplanationCard } from "./flag-explanation-card";

const criticalFlag = {
  type: "duplicate_entry" as const,
  label: "Duplicate Entry",
  explanation:
    "This booking appears to be a duplicate of 5000000141 (same account, similar amount within 5%, posted within 2 days).",
  confidence: "high" as const,
  relatedDocumentId: "5000000141",
};

const warningFlag = {
  type: "unusual_amount" as const,
  label: "Unusual Amount",
  explanation: "Amount exceeds 2x the account average.",
  confidence: "medium" as const,
  relatedDocumentId: null,
};

describe("FlagExplanationCard", () => {
  it("renders the flag type label", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    expect(screen.getByText("Duplicate Entry")).toBeInTheDocument();
  });

  it("renders the explanation text", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    expect(
      screen.getByText(/This booking appears to be a duplicate/),
    ).toBeInTheDocument();
  });

  it("renders the confidence level", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders related document link when present", () => {
    render(<FlagExplanationCard flag={criticalFlag} severity="critical" />);
    const link = screen.getByRole("link", { name: /5000000141/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/bookings/5000000141");
  });

  it("does not render related document link when null", () => {
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
