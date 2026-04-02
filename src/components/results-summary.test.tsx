import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsSummary } from "./results-summary";

describe("ResultsSummary", () => {
  it("shows total count when not filtered", () => {
    render(<ResultsSummary totalCount={168} filteredCount={168} />);
    expect(screen.getByText("168 documents")).toBeInTheDocument();
  });

  it("shows filtered count when filters are active", () => {
    render(<ResultsSummary totalCount={168} filteredCount={22} />);
    expect(screen.getByText("Showing 22 of 168 documents")).toBeInTheDocument();
  });
});
