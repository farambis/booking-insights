import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: React.ComponentProps<"img">) => <img {...props} />,
}));

describe("Home page", () => {
  it("renders the heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        name: /to get started, edit the page\.tsx file/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders deploy and documentation links", () => {
    render(<Home />);
    expect(
      screen.getByRole("link", { name: /deploy now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /documentation/i }),
    ).toBeInTheDocument();
  });
});
