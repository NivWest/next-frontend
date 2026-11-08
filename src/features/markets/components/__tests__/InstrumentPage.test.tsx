import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const orderTicketProps = vi.fn<(props: { orderbookId: string }) => void>();
vi.mock("@/features/trading/components/OrderTicket", () => ({
  OrderTicket: (props: { orderbookId: string }) => {
    orderTicketProps(props);
    return (
      <section aria-labelledby="order-ticket-heading">
        <h2 id="order-ticket-heading">Order ticket</h2>
      </section>
    );
  },
}));

interface AddToWatchlistMockProps {
  orderbookId: string;
  symbol: string;
}

const addToWatchlistProps = vi.fn<(props: AddToWatchlistMockProps) => void>();
vi.mock("@/features/watchlist/components/AddToWatchlistMenu", () => ({
  AddToWatchlistMenu: (props: AddToWatchlistMockProps) => {
    addToWatchlistProps(props);
    return <button type="button">Add to watchlist</button>;
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


describe("InstrumentPage", () => {
  beforeEach(() => {
    getDetailsMock.mockReset();
    getQuoteMock.mockReset();
    priceChartProps.mockReset();
    orderTicketProps.mockReset();
    addToWatchlistProps.mockReset();
    getDetailsMock.mockResolvedValue(fjordDetails());
    getQuoteMock.mockResolvedValue(fjordQuote());
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

  it("renders the order ticket between the quote and the price chart, without the Trade Asset placeholder", async () => {
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    const ticket = await screen.findByRole("region", { name: "Order ticket" });
    expect(orderTicketProps).toHaveBeenLastCalledWith({ orderbookId: "SIM-FJRD" });
    const quote = screen.getByRole("region", { name: "Quote" });
    const chart = screen.getByRole("img", { name: "Price chart" });
    expect(quote.compareDocumentPosition(ticket) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ticket.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Trade Asset" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add to watchlist" }).length).toBeGreaterThan(0);
  });

  it("does not render the order ticket while loading or on error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getDetailsMock.mockRejectedValue(new Error("instrument not found"));
    render(<InstrumentPage orderbookId="SIM-NOPE" />);

    expect(screen.queryByRole("region", { name: "Order ticket" })).not.toBeInTheDocument();
    await screen.findByRole("alert");
    expect(screen.queryByRole("region", { name: "Order ticket" })).not.toBeInTheDocument();
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

  it("puts the Add to watchlist menu in the page header, next to the title, with the symbol", async () => {
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    const heading = await screen.findByRole("heading", { level: 1, name: "Fjord Robotics" });
    const header = heading.parentElement;
    if (!header) throw new Error("no header row");
    expect(within(header).getByRole("button", { name: "Add to watchlist" })).toBeInTheDocument();
    expect(addToWatchlistProps).toHaveBeenLastCalledWith({ orderbookId: "SIM-FJRD", symbol: "FJRD" });
    // It comes before the quote, i.e. at the top of the page, away from the fixed bottom banner and toasts.
    const quote = screen.getByRole("region", { name: "Quote" });
    expect(header.compareDocumentPosition(quote) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add to Watchlist" })).not.toBeInTheDocument();
  });

  it("falls back to the orderbook id as the symbol", async () => {
    getDetailsMock.mockResolvedValue(fjordDetails({ symbol: "" }));
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    await screen.findByRole("heading", { level: 1, name: "Fjord Robotics" });
    expect(addToWatchlistProps).toHaveBeenLastCalledWith({ orderbookId: "SIM-FJRD", symbol: "SIM-FJRD" });
  });

  it("does not offer the watchlist menu before the instrument has loaded", () => {
    getDetailsMock.mockReturnValue(new Promise<InstrumentDetails>(() => {}));
    render(<InstrumentPage orderbookId="SIM-FJRD" />);

    expect(screen.queryByRole("button", { name: "Add to watchlist" })).not.toBeInTheDocument();
  });
});
