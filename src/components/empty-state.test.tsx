import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the heading", () => {
    render(<EmptyState heading="No results found" />);
    expect(
      screen.getByRole("heading", { name: "No results found" }),
    ).toBeInTheDocument();
  });

  it("renders subtext when provided", () => {
    render(
      <EmptyState heading="No results" subtext="Try adjusting your filters" />,
    );
    expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
  });

  it("renders CTA children when provided", () => {
    render(
      <EmptyState heading="No results">
        <button>Reset filters</button>
      </EmptyState>,
    );
    expect(
      screen.getByRole("button", { name: "Reset filters" }),
    ).toBeInTheDocument();
  });
});
