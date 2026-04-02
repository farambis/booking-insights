import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";

describe("NotFound page", () => {
  it("renders the headline", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /not yet built/i }),
    ).toBeInTheDocument();
  });

  it("renders the body text", () => {
    render(<NotFound />);
    expect(
      screen.getByText(
        /this page doesn't exist yet\. northscope is under active development\./i,
      ),
    ).toBeInTheDocument();
  });

  it("renders a link to the dashboard", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
