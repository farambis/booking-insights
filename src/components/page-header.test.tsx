import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("renders the title", () => {
    render(<PageHeader title="Bookings" />);
    expect(
      screen.getByRole("heading", { name: "Bookings" }),
    ).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    render(<PageHeader title="Bookings" subtitle="168 documents" />);
    expect(screen.getByText("168 documents")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    const { container } = render(<PageHeader title="Bookings" />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("renders action slot children", () => {
    render(
      <PageHeader title="Bookings">
        <button>Export CSV</button>
      </PageHeader>,
    );
    expect(
      screen.getByRole("button", { name: "Export CSV" }),
    ).toBeInTheDocument();
  });
});
