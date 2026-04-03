import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "./kpi-card";

describe("KpiCard", () => {
  it("renders label and formatted value", () => {
    render(
      <KpiCard
        label="Total Documents"
        formattedValue="168"
        subtitle="425 lines"
        variant="default"
      />,
    );
    expect(screen.getByText("Total Documents")).toBeInTheDocument();
    expect(screen.getByText("168")).toBeInTheDocument();
  });

  it("renders as a link when href is provided", () => {
    render(
      <KpiCard
        label="Critical Flags"
        formattedValue="8"
        subtitle="4.8% of docs"
        variant="critical"
        href="/bookings?status=critical"
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/bookings?status=critical");
  });

  it("renders as a div when no href is provided", () => {
    const { container } = render(
      <KpiCard
        label="Total"
        formattedValue="168"
        subtitle={null}
        variant="default"
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("div")).not.toBeNull();
  });

  it("renders subtitle when provided", () => {
    render(
      <KpiCard
        label="Critical Flags"
        formattedValue="8"
        subtitle="4.8% of docs"
        variant="critical"
      />,
    );
    expect(screen.getByText("4.8% of docs")).toBeInTheDocument();
  });

  it("does not render subtitle when null", () => {
    const { container } = render(
      <KpiCard
        label="Total"
        formattedValue="168"
        subtitle={null}
        variant="default"
      />,
    );
    const subtitleEl = container.querySelector("[data-testid='kpi-subtitle']");
    expect(subtitleEl).toBeNull();
  });

  it("applies critical variant styles", () => {
    render(
      <KpiCard
        label="Critical"
        formattedValue="8"
        subtitle={null}
        variant="critical"
      />,
    );
    const value = screen.getByText("8");
    expect(value.className).toContain("text-critical");
  });

  it("applies warning variant styles", () => {
    render(
      <KpiCard
        label="Warnings"
        formattedValue="14"
        subtitle={null}
        variant="warning"
      />,
    );
    const value = screen.getByText("14");
    expect(value.className).toContain("text-warning");
  });

  it("applies clean variant styles", () => {
    render(
      <KpiCard
        label="Clean"
        formattedValue="146"
        subtitle={null}
        variant="clean"
      />,
    );
    const value = screen.getByText("146");
    expect(value.className).toContain("text-clean");
  });

  it("applies default variant styles", () => {
    render(
      <KpiCard
        label="Total"
        formattedValue="168"
        subtitle={null}
        variant="default"
      />,
    );
    const value = screen.getByText("168");
    expect(value.className).toContain("text-neutral-900");
  });
});
