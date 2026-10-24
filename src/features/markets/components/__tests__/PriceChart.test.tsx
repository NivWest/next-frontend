import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Candle, CandlePeriod, CandlesResponse } from "../../types";
import { PriceChart } from "../PriceChart";

const getCandlesMock = vi.fn<(orderbookId: string, period: CandlePeriod) => Promise<CandlesResponse>>();
vi.mock("@/features/markets/api/market", () => ({
  getCandles: (orderbookId: string, period: CandlePeriod) => getCandlesMock(orderbookId, period),
}));

interface Deferred {
  resolve: (candles: Candle[]) => void;
  reject: (error: Error) => void;
}

/** Queues each getCandles call so the test decides when and how it settles. */
function deferCalls(): Deferred[] {
  const calls: Deferred[] = [];
  getCandlesMock.mockImplementation(
    (orderbookId, period) =>
      new Promise<CandlesResponse>((resolve, reject) => {
        calls.push({
          resolve: (candles) => resolve({ orderbook_id: orderbookId, period, candles }),
          reject,
        });
      }),
  );
  return calls;
}

const sampleCandles: Candle[] = [
  { t: "2026-03-04T00:00:00Z", o: 100, h: 102, l: 99, c: 101, v: 10 },
  { t: "2026-03-05T00:00:00Z", o: 101, h: 104, l: 100, c: 103, v: 12 },
];

function respondWith(candles: Candle[]): void {
  getCandlesMock.mockImplementation((orderbookId, period) =>
    Promise.resolve({ orderbook_id: orderbookId, period, candles }),
  );
}

function periodButton(name: string): HTMLElement {
  return within(screen.getByRole("group", { name: "Chart period" })).getByRole("button", { name });
}

describe("PriceChart", () => {
  beforeEach(() => {
    getCandlesMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders one button per period with exact accessible names", async () => {
    respondWith(sampleCandles);
    render(<PriceChart orderbookId="SIM-FJRD" />);

    const group = screen.getByRole("group", { name: "Chart period" });
    const names = within(group)
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(names).toEqual(["1D", "1W", "1M", "3M", "1Y"]);
    for (const button of within(group).getAllByRole("button")) {
      expect(button).toHaveAttribute("type", "button");
    }
    await screen.findByRole("img", { name: "Price chart" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("starts on the default 1M period and fetches it", async () => {
    respondWith(sampleCandles);
    render(<PriceChart orderbookId="SIM-FJRD" />);

    expect(periodButton("1M")).toHaveAttribute("aria-pressed", "true");
    expect(periodButton("1D")).toHaveAttribute("aria-pressed", "false");
    expect(getCandlesMock).toHaveBeenCalledWith("SIM-FJRD", "1m");
    await act(async () => {});
  });

  it("honours initialPeriod", async () => {
    respondWith(sampleCandles);
    render(<PriceChart orderbookId="SIM-FJRD" initialPeriod="1y" />);

    expect(periodButton("1Y")).toHaveAttribute("aria-pressed", "true");
    expect(getCandlesMock).toHaveBeenCalledWith("SIM-FJRD", "1y");
    await act(async () => {});
  });

  it("toggles aria-pressed and fetches the mapped period on click", async () => {
    respondWith(sampleCandles);
    const onCandles = vi.fn();
    render(<PriceChart orderbookId="SIM-FJRD" onCandles={onCandles} />);
    await act(async () => {});

    fireEvent.click(periodButton("1D"));
    expect(periodButton("1D")).toHaveAttribute("aria-pressed", "true");
    expect(periodButton("1M")).toHaveAttribute("aria-pressed", "false");
    expect(getCandlesMock).toHaveBeenLastCalledWith("SIM-FJRD", "1d");
    await act(async () => {});

    fireEvent.click(periodButton("3M"));
    expect(getCandlesMock).toHaveBeenLastCalledWith("SIM-FJRD", "3m");
    await act(async () => {});

    expect(onCandles.mock.calls).toEqual([
      [sampleCandles, "1m"],
      [sampleCandles, "1d"],
      [sampleCandles, "3m"],
    ]);
  });

  it("shows a loading status until candles arrive", async () => {
    const calls = deferCalls();
    render(<PriceChart orderbookId="SIM-FJRD" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading chart…");
    expect(screen.getByRole("img", { name: "Price chart" })).toBeInTheDocument();

    await act(async () => calls[0].resolve(sampleCandles));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an alert when the request fails and keeps the period buttons usable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getCandlesMock.mockRejectedValueOnce(new Error("boom"));
    respondWith(sampleCandles);
    const onCandles = vi.fn();
    render(<PriceChart orderbookId="SIM-FJRD" onCandles={onCandles} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Price data is unavailable right now.");
    expect(onCandles).not.toHaveBeenCalled();

    const button = periodButton("1W");
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(getCandlesMock).toHaveBeenLastCalledWith("SIM-FJRD", "1w");
    await act(async () => {});
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onCandles).toHaveBeenCalledWith(sampleCandles, "1w");
  });

  it("shows an empty message when the period has no candles", async () => {
    respondWith([]);
    const onCandles = vi.fn();
    render(<PriceChart orderbookId="SIM-FJRD" onCandles={onCandles} />);

    expect(await screen.findByText("No price data for this period.")).toBeInTheDocument();
    expect(onCandles).toHaveBeenCalledWith([], "1m");
    expect(periodButton("1Y")).toBeEnabled();
  });

  it("ignores a stale response after switching period", async () => {
    const calls = deferCalls();
    const onCandles = vi.fn();
    render(<PriceChart orderbookId="SIM-FJRD" onCandles={onCandles} />);

    fireEvent.click(periodButton("1Y"));
    expect(calls).toHaveLength(2);

    await act(async () => calls[1].resolve([]));
    expect(screen.getByText("No price data for this period.")).toBeInTheDocument();

    await act(async () => calls[0].resolve(sampleCandles));
    expect(screen.getByText("No price data for this period.")).toBeInTheDocument();
    expect(onCandles.mock.calls).toEqual([[[], "1y"]]);
  });

  it("ignores a stale failure after switching period", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const calls = deferCalls();
    render(<PriceChart orderbookId="SIM-FJRD" />);

    fireEvent.click(periodButton("1W"));
    await act(async () => calls[1].resolve([]));
    await act(async () => calls[0].reject(new Error("late")));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("No price data for this period.")).toBeInTheDocument();
  });

  it("refetches and ignores the old instrument's response when the id changes", async () => {
    const calls = deferCalls();
    const onCandles = vi.fn();
    const { rerender } = render(<PriceChart orderbookId="SIM-FJRD" onCandles={onCandles} />);

    rerender(<PriceChart orderbookId="SIM-NORD" onCandles={onCandles} />);
    expect(getCandlesMock).toHaveBeenLastCalledWith("SIM-NORD", "1m");
    expect(screen.getByRole("status")).toHaveTextContent("Loading chart…");

    await act(async () => calls[0].resolve(sampleCandles));
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(onCandles).not.toHaveBeenCalled();

    await act(async () => calls[1].resolve([]));
    expect(screen.getByText("No price data for this period.")).toBeInTheDocument();
    expect(onCandles).toHaveBeenCalledWith([], "1m");
  });
});
