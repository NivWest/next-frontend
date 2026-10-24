import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Screener } from "../components/Screener";
import type { SearchResponse } from "../types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn(), forward: vi.fn() }),
}));

const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({
  api: (endpoint: string) => apiMock(endpoint),
}));

const searchResponse: SearchResponse = {
  hits: [
    {
      type: "STOCK",
      orderBookId: "5361",
      title: "Fjord Industries (FJRD)",
      marketPlaceName: "Stockholmsbörsen",
      price: { last: 101.5, currency: "SEK", todayChangePercent: "1,2", todayChangeDirection: 1 },
    },
    { type: "FUND", orderBookId: "999", title: "Fjord Fund" },
  ],
};

describe("Screener", () => {
  beforeEach(() => {
    push.mockReset();
    apiMock.mockReset();
    apiMock.mockResolvedValue(searchResponse);
  });

  it("is headed Markets and has a labelled, empty search input by default", () => {
    render(<Screener />);

    expect(screen.getByRole("heading", { level: 1, name: "Markets" })).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Search markets" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Search by ticker, company, or sector...");
    expect(screen.getByText("Type at least 2 characters to search Avanza API.")).toBeInTheDocument();
    expect(apiMock).not.toHaveBeenCalled();
  });

  it("prefills the search input from initialQuery and searches for it", async () => {
    render(<Screener initialQuery="fjord" />);

    expect(screen.getByRole("textbox", { name: "Search markets" })).toHaveValue("fjord");

    const link = await screen.findByRole("link", { name: "Fjord Industries (FJRD)" }, { timeout: 2000 });
    expect(apiMock).toHaveBeenCalledWith("stocks/search?q=fjord");
    expect(link).toHaveAttribute("href", "/markets/5361");
    // Non-stock hits are filtered out.
    expect(screen.queryByText("Fjord Fund")).not.toBeInTheDocument();
  });

  it("navigates to the instrument page when a result row is clicked", async () => {
    render(<Screener initialQuery="fjord" />);

    await screen.findByRole("link", { name: "Fjord Industries (FJRD)" }, { timeout: 2000 });
    fireEvent.click(screen.getByText("Stockholmsbörsen"));

    expect(push).toHaveBeenCalledWith("/markets/5361");
  });
});
