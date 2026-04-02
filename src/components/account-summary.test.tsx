import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountSummary } from "./account-summary";

const baseSummary = {
  account: "060000",
  accountName: "Gehälter",
  totalBookings: 12,
  flaggedCount: 3,
  flaggedPercent: 25.0,
  averageAmount: 1280,
  currentAmount: 1404,
};

describe("AccountSummary", () => {
  it("renders the account header", () => {
    render(
      <AccountSummary
        summary={{
          ...baseSummary,
          vsAverage: { percent: 10, severity: "normal" },
        }}
      />,
    );
    expect(screen.getByText("060000 \u2014 Geh\u00e4lter")).toBeInTheDocument();
  });

  it("renders total bookings count", () => {
    render(
      <AccountSummary
        summary={{
          ...baseSummary,
          vsAverage: { percent: 10, severity: "normal" },
        }}
      />,
    );
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders flagged count and percent", () => {
    render(
      <AccountSummary
        summary={{
          ...baseSummary,
          vsAverage: { percent: 10, severity: "normal" },
        }}
      />,
    );
    // The dd element contains "3 (25.0%)" as its text content
    const flaggedDd = screen.getByText(/3 \(25\.0%\)/);
    expect(flaggedDd).toBeInTheDocument();
  });

  it("applies green styling for normal severity (within 20%)", () => {
    const { container } = render(
      <AccountSummary
        summary={{
          ...baseSummary,
          vsAverage: { percent: 10, severity: "normal" },
        }}
      />,
    );
    const vsAvgEl = container.querySelector("[data-testid='vs-average']");
    expect(vsAvgEl?.className).toContain("text-clean");
  });

  it("applies amber styling for elevated severity (20-50% above)", () => {
    const { container } = render(
      <AccountSummary
        summary={{
          ...baseSummary,
          vsAverage: { percent: 35, severity: "elevated" },
        }}
      />,
    );
    const vsAvgEl = container.querySelector("[data-testid='vs-average']");
    expect(vsAvgEl?.className).toContain("text-warning");
  });

  it("applies red styling for high severity (>50% above)", () => {
    const { container } = render(
      <AccountSummary
        summary={{
          ...baseSummary,
          vsAverage: { percent: 120, severity: "high" },
        }}
      />,
    );
    const vsAvgEl = container.querySelector("[data-testid='vs-average']");
    expect(vsAvgEl?.className).toContain("text-critical");
  });

  it("renders the view account history link", () => {
    render(
      <AccountSummary
        summary={{
          ...baseSummary,
          vsAverage: { percent: 10, severity: "normal" },
        }}
      />,
    );
    const link = screen.getByRole("link", { name: /060000/ });
    expect(link).toHaveAttribute("href", "/bookings?account=060000");
  });
});
