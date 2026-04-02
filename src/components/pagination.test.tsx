import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("renders page indicator", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        prevUrl={null}
        nextUrl="/bookings?page=2"
      />,
    );
    expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
  });

  it("renders Previous as disabled span on first page", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        prevUrl={null}
        nextUrl="/bookings?page=2"
      />,
    );
    const prev = screen.getByText("Previous");
    expect(prev.tagName).toBe("SPAN");
    expect(prev.className).toContain("cursor-not-allowed");
  });

  it("renders Next as disabled span on last page", () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        prevUrl="/bookings?page=4"
        nextUrl={null}
      />,
    );
    const next = screen.getByText("Next");
    expect(next.tagName).toBe("SPAN");
    expect(next.className).toContain("cursor-not-allowed");
  });

  it("renders Previous as link when not on first page", () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        prevUrl="/bookings?page=2"
        nextUrl="/bookings?page=4"
      />,
    );
    const prev = screen.getByRole("link", { name: "Previous" });
    expect(prev).toHaveAttribute("href", "/bookings?page=2");
  });

  it("renders Next as link when not on last page", () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        prevUrl="/bookings?page=2"
        nextUrl="/bookings?page=4"
      />,
    );
    const next = screen.getByRole("link", { name: "Next" });
    expect(next).toHaveAttribute("href", "/bookings?page=4");
  });

  it("does not render when there is only one page", () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        prevUrl={null}
        nextUrl={null}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
