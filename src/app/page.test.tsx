import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Root page", () => {
  it("redirects to /dashboard", async () => {
    const { redirect } = await import("next/navigation");
    // Import page after mock is in place
    const { default: RootPage } = await import("./page");

    RootPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
