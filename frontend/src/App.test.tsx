import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";

// Mock fetch to avoid real API calls
beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => [],
  } as Response);
});

describe("App", () => {
  it("renders heading", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("するリスト")).toBeInTheDocument();
    });
  });
});
