import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useUIStore } from "@/store/useUIStore";
import type { CandlePeriod, InstrumentDetails, Quote } from "../../types";
import { InstrumentPage } from "../InstrumentPage";

const getDetailsMock = vi.fn<(orderbookId: string) => Promise<InstrumentDetails>>();
const getQuoteMock = vi.fn<(orderbookId: string) => Promise<Quote>>();
vi.mock("@/features/markets/api/market", () => ({
  getInstrumentDetails: (orderbookId: string) => getDetailsMock(orderbookId),
  getQuote: (orderbookId: string) => getQuoteMock(orderbookId),
}));

interface PriceChartMockProps {
  orderbookId: string;
  currency?: string;
  initialPeriod?: CandlePeriod;
}

const priceChartProps = vi.fn<(props: PriceChartMockProps) => void>();
vi.mock("../PriceChart", () => ({
  PriceChart: (props: PriceChartMockProps) => {
    priceChartProps(props);
    return <div role="img" aria-label="Price chart" />;
  },
}));

function fjordDetails(overrides: Partial<InstrumentDetails> = {}): InstrumentDetails {
  return {
    orderbook_id: "SIM-FJRD",
    symbol: "FJRD",
    name: "Fjord Robotics",
    currency: "SEK",
    market: "Simulated",
    sector: "Industrials",
    description: "Fjord Robotics builds warehouse robots.",
    last_price: 1234.5,
    change_percent: 1.25,
    key_indicators: { pe_ratio: 18.456, dividend_yield_pct: 3.25, market_cap: 12_340_000_000 },
    ...overrides,
  };
}

function fjordQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    orderbook_id: "SIM-FJRD",
    symbol: "FJRD",
    last: 1234.5,
    bid: 1234.25,
    ask: 1234.75,
    change_percent: 1.25,
    currency: "SEK",
    updated_at: "2026-10-25T12:34:56Z",
    ...overrides,
  };
}

function indicator(label: string): HTMLElement {
  const term = screen.getByText(label);
  const card = term.parentElement;
  if (!card) throw new Error(`no card for ${label}`);
  return card;
}

const addToWatchlist = vi.fn<(ticker: string, name?: string) => Promise<void>>();
const addToast = vi.fn();

describe("InstrumentPage", () => {
  beforeEach(() => {
    getDetailsMock.mockReset();
    getQuoteMock.mockReset();
    priceChartProps.mockReset();
    addToWatchlist.mockReset();
    addToast.mockReset();
    getDetailsMock.mockResolvedValue(fjordDetails());
    getQuoteMock.mockResolvedValue(fjordQuote());
    addToWatchlist.mockResolvedValue(undefined);
    usePortfolioStore.setState({ addToWatchlist });
    useUIStore.setState({ addToast });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading status headed by the id, then the instrument name and meta line", async () => {
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Instrument SIM-FJRD" })).toBeInTheDocument();

    expect(await screen.findByRole("heading", { level: 1, name: "Fjord Robotics" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("FJRD · Simulated · Industrials")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Markets" })).toHaveAttribute("href", "/markets");
    expect(getDetailsMock).toHaveBeenCalledWith("SIM-FJRD");
    expect(getQuoteMock).toHaveBeenCalledWith("SIM-FJRD");
  });

  it("shows the simulated badge for SIM- ids", async () => {
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    await screen.findByRole("heading", { level: 1, name: "Fjord Robotics" });
    expect(screen.getByText("Simulated market data")).toBeInTheDocument();
  });

  it("does not show the simulated badge for real ids", async () => {
    getDetailsMock.mockResolvedValue(fjordDetails({ orderbook_id: "5361", name: "Volvo B", symbol: "VOLV B" }));
    render(<InstrumentPage orderbookId="5361" />);

    await screen.findByRole("heading", { level: 1, name: "Volvo B" });
    expect(screen.queryByText("Simulated market data")).not.toBeInTheDocument();
  });

  it("renders the quote with last price, change, bid, ask and update time", async () => {
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    const quote = await screen.findByRole("region", { name: "Quote" });
    expect(within(quote).getByText("1,234.50 SEK")).toBeInTheDocument();
    expect(within(quote).getByText("+1.25%")).toBeInTheDocument();
    expect(within(quote).getByText("1,234.25 SEK")).toBeInTheDocument();
    expect(within(quote).getByText("1,234.75 SEK")).toBeInTheDocument();
    expect(within(quote).getByText("Bid")).toBeInTheDocument();
    expect(within(quote).getByText("Ask")).toBeInTheDocument();
    expect(within(quote).getByText(/^Updated/)).toBeInTheDocument();
  });

  it("renders the price chart with the instrument currency and default period", async () => {
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    expect(await screen.findByRole("img", { name: "Price chart" })).toBeInTheDocument();
    expect(priceChartProps).toHaveBeenLastCalledWith({ orderbookId: "SIM-FJRD", currency: "SEK", initialPeriod: "1m" });
  });

  it("formats the key indicators and the company overview", async () => {
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    await screen.findByRole("heading", { level: 2, name: "Key Indicators" });
    expect(within(indicator("P/E Ratio")).getByText("18.46")).toBeInTheDocument();
    expect(within(indicator("Dividend Yield")).getByText("3.25%")).toBeInTheDocument();
    expect(within(indicator("Market Cap")).getByText("12.34B SEK")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Company Overview" })).toBeInTheDocument();
    expect(screen.getByText("Fjord Robotics builds warehouse robots.")).toBeInTheDocument();
    for (const removed of ["P/S Ratio", "ROE", "CEO", "Country", "Outstanding Shares", "Avanza Owners"]) {
      expect(screen.queryByText(removed)).not.toBeInTheDocument();
    }
  });

  it("uses formatMoney for small market caps", async () => {
    getDetailsMock.mockResolvedValue(
      fjordDetails({ key_indicators: { pe_ratio: 5, dividend_yield_pct: 0, market_cap: 950_000 } }),
    );
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    await screen.findByRole("heading", { level: 2, name: "Key Indicators" });
    expect(within(indicator("Market Cap")).getByText("950,000.00 SEK")).toBeInTheDocument();
    expect(within(indicator("Dividend Yield")).getByText("0.00%")).toBeInTheDocument();
  });

  it("shows a dash for missing indicators and a fallback description", async () => {
    getDetailsMock.mockResolvedValue(
      fjordDetails({ description: "", key_indicators: { pe_ratio: null, dividend_yield_pct: null, market_cap: null } }),
    );
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    await screen.findByRole("heading", { level: 2, name: "Key Indicators" });
    expect(within(indicator("P/E Ratio")).getByText("—")).toBeInTheDocument();
    expect(within(indicator("Dividend Yield")).getByText("—")).toBeInTheDocument();
    expect(within(indicator("Market Cap")).getByText("—")).toBeInTheDocument();
    expect(screen.getByText("No description available.")).toBeInTheDocument();
  });

  it("shows an alert when the instrument is not found", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getDetailsMock.mockRejectedValue(new Error("instrument not found"));
    render(<InstrumentPage orderbookId="SIM-NOPE" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load instrument details. Please try again later.",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Instrument SIM-NOPE" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Price chart" })).not.toBeInTheDocument();
  });

  it("shows an alert when the quote fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getQuoteMock.mockRejectedValue(new Error("boom"));
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load instrument details.");
  });

  it("adds the instrument to the watchlist by symbol and name", async () => {
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    fireEvent.click(await screen.findByRole("button", { name: "Add to Watchlist" }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith("Fjord Robotics added to watchlist!", "success"));
    expect(addToWatchlist).toHaveBeenCalledWith("FJRD", "Fjord Robotics");
  });

  it("falls back to the orderbook id as ticker and toasts an error when saving fails", async () => {
    getDetailsMock.mockResolvedValue(fjordDetails({ symbol: "" }));
    addToWatchlist.mockRejectedValue(new Error("unauthorized"));
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    fireEvent.click(await screen.findByRole("button", { name: "Add to Watchlist" }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith("Sign in to save to your watchlist", "error"));
    expect(addToWatchlist).toHaveBeenCalledWith("SIM-FJRD", "Fjord Robotics");
  });
});
