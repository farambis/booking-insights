import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "./pagination";

const defaultPageSizeProps = {
  currentPageSize: 50,
  pageSizeOptions: [25, 50, 100] as const,
  pageSizeUrls: {
    25: "/bookings?pageSize=25",
    50: "/bookings",
    100: "/bookings?pageSize=100",
  },
};

describe("Pagination", () => {
  it("renders page indicator", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        prevUrl={null}
        nextUrl="/bookings?page=2"
        {...defaultPageSizeProps}
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
        {...defaultPageSizeProps}
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
        {...defaultPageSizeProps}
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
        {...defaultPageSizeProps}
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
        {...defaultPageSizeProps}
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
        currentPageSize={50}
        pageSizeOptions={[50]}
        pageSizeUrls={{ 50: "/bookings" }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders page size options", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        prevUrl={null}
        nextUrl="/bookings?page=2"
        {...defaultPageSizeProps}
      />,
    );
    expect(screen.getByText("Rows per page:")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "25" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "100" })).toBeInTheDocument();
  });

  it("highlights the current page size", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        prevUrl={null}
        nextUrl="/bookings?page=2"
        {...defaultPageSizeProps}
      />,
    );
    const active = screen.getByRole("link", { name: "50" });
    expect(active.className).toContain("bg-neutral-900");
  });
});
