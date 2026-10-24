import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketSearch } from "../MarketSearch";
import type { InstrumentSearchResponse } from "../../types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn(), forward: vi.fn() }),
}));

const searchMock = vi.fn<(query: string) => Promise<InstrumentSearchResponse>>();
vi.mock("@/features/markets/api/market", () => ({
  searchInstruments: (query: string) => searchMock(query),
}));

const fjordResponse: InstrumentSearchResponse = {
  items: [
    {
      orderbook_id: "SIM-FJRD",
      symbol: "FJRD",
      name: "Fjord Robotics",
      currency: "SEK",
      market: "Simulated",
      last_price: 1234.5,
      change_percent: 1.25,
    },
  ],
  next_cursor: null,
};

const WAIT = { timeout: 2000 };

describe("MarketSearch", () => {
  beforeEach(() => {
    push.mockReset();
    searchMock.mockReset();
    searchMock.mockResolvedValue(fjordResponse);
  });

  it("is headed Markets with a labelled, empty search input and no filter selects", () => {
    render(<MarketSearch />);

    expect(screen.getByRole("heading", { level: 1, name: "Markets" })).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Search markets" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Search by ticker or company name...");
    expect(screen.getByText("Type at least 2 characters to search.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /filters/i })).not.toBeInTheDocument();
  });

  it("does not search for queries shorter than 2 characters", async () => {
    render(<MarketSearch />);

    fireEvent.change(screen.getByRole("textbox", { name: "Search markets" }), { target: { value: " f " } });
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(searchMock).not.toHaveBeenCalled();
    expect(screen.getByText("Type at least 2 characters to search.")).toBeInTheDocument();
  });

  it("searches for initialQuery and links each result to its instrument page", async () => {
    render(<MarketSearch initialQuery="fjord" />);

    expect(screen.getByRole("textbox", { name: "Search markets" })).toHaveValue("fjord");

    const link = await screen.findByRole("link", { name: "Fjord Robotics" }, WAIT);
    expect(searchMock).toHaveBeenCalledWith("fjord");
    expect(link).toHaveAttribute("href", "/markets/SIM-FJRD");
    expect(screen.getByText("FJRD · SIM-FJRD")).toBeInTheDocument();
    expect(screen.getByText("1,234.50 SEK")).toBeInTheDocument();
    expect(screen.getByText("+1.25%")).toHaveClass("text-green-500");
    expect(screen.getByText("Simulated")).toBeInTheDocument();
  });

  it("trims the query before searching", async () => {
    render(<MarketSearch initialQuery="  fjord " />);

    await screen.findByRole("link", { name: "Fjord Robotics" }, WAIT);
    expect(searchMock).toHaveBeenCalledWith("fjord");
  });

  it("navigates to the instrument page when a result row is clicked", async () => {
    render(<MarketSearch initialQuery="fjord" />);

    await screen.findByRole("link", { name: "Fjord Robotics" }, WAIT);
    fireEvent.click(screen.getByText("Simulated"));

    expect(push).toHaveBeenCalledWith("/markets/SIM-FJRD");
  });

  it("shows an empty state when nothing matches", async () => {
    searchMock.mockResolvedValue({ items: [], next_cursor: null });
    render(<MarketSearch initialQuery="zzz" />);

    expect(await screen.findByText('No instruments found for "zzz".', undefined, WAIT)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("shows an alert when the search request fails", async () => {
    searchMock.mockRejectedValue(new Error("boom"));
    render(<MarketSearch initialQuery="fjord" />);

    expect(await screen.findByRole("alert", undefined, WAIT)).toHaveTextContent(
      "Search is unavailable right now. Please try again.",
    );
  });

  it("ignores a stale response once the query has changed", async () => {
    let resolveFirst: (value: InstrumentSearchResponse) => void = () => {};
    searchMock.mockImplementation((query: string) =>
      query === "fjord"
        ? new Promise<InstrumentSearchResponse>((resolve) => {
            resolveFirst = resolve;
          })
        : Promise.resolve({ items: [], next_cursor: null }),
    );
    render(<MarketSearch initialQuery="fjord" />);
    await vi.waitFor(() => expect(searchMock).toHaveBeenCalledWith("fjord"), WAIT);

    fireEvent.change(screen.getByRole("textbox", { name: "Search markets" }), { target: { value: "zzz" } });
    resolveFirst(fjordResponse);

    expect(await screen.findByText('No instruments found for "zzz".', undefined, WAIT)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Fjord Robotics" })).not.toBeInTheDocument();
  });
});
