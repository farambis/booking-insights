import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Error from "./error";

function renderError(overrides?: { reset?: () => void }) {
  const props = {
    error: Object.assign(new globalThis.Error("test error"), {
      digest: "abc123",
    }),
    reset: overrides?.reset ?? vi.fn(),
  };
  return { ...render(<Error {...props} />), props };
}

describe("Error page", () => {
  it("renders the headline", () => {
    renderError();
    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it("renders the body text", () => {
    renderError();
    expect(
      screen.getByText(
        /an unexpected error occurred\. your data has not been affected\./i,
      ),
    ).toBeInTheDocument();
  });

  it("renders a Try Again button that calls reset", async () => {
    const reset = vi.fn();
    renderError({ reset });
    const button = screen.getByRole("button", { name: /try again/i });
    await userEvent.click(button);
    expect(reset).toHaveBeenCalledOnce();
  });

  it("renders a link to the dashboard", () => {
    renderError();
    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
