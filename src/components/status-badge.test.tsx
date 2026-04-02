import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders critical badge with correct text", () => {
    render(<StatusBadge status="critical" />);
    expect(screen.getByText("CRIT")).toBeInTheDocument();
  });

  it("renders warning badge with correct text", () => {
    render(<StatusBadge status="warning" />);
    expect(screen.getByText("WARN")).toBeInTheDocument();
  });

  it("renders clean badge with correct text", () => {
    render(<StatusBadge status="clean" />);
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("renders info badge with correct text", () => {
    render(<StatusBadge status="info" />);
    expect(screen.getByText("INFO")).toBeInTheDocument();
  });

  it("applies critical variant styles", () => {
    render(<StatusBadge status="critical" />);
    const badge = screen.getByText("CRIT");
    expect(badge.className).toContain("bg-critical-bg");
    expect(badge.className).toContain("text-critical");
    expect(badge.className).toContain("border-critical-border");
  });

  it("applies warning variant styles", () => {
    render(<StatusBadge status="warning" />);
    const badge = screen.getByText("WARN");
    expect(badge.className).toContain("bg-warning-bg");
    expect(badge.className).toContain("text-warning");
  });

  it("applies default size styles", () => {
    render(<StatusBadge status="critical" />);
    const badge = screen.getByText("CRIT");
    expect(badge.className).toContain("text-xs");
    expect(badge.className).toContain("px-2");
    expect(badge.className).toContain("py-0.5");
  });

  it("applies large size styles", () => {
    render(<StatusBadge status="critical" size="large" />);
    const badge = screen.getByText("CRIT");
    expect(badge.className).toContain("text-sm");
    expect(badge.className).toContain("px-3");
    expect(badge.className).toContain("py-1");
  });
});
