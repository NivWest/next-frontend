import { describe, expect, it } from "vitest";
import { periodChange, toChartPoints } from "../candles";
import type { Candle } from "../types";

function candle(t: string, o: number, c: number): Candle {
  return { t, o, h: Math.max(o, c), l: Math.min(o, c), c, v: 100 };
}

const candles: Candle[] = [
  candle("2026-03-04T09:05:00Z", 100, 101),
  candle("2026-03-04T23:30:00Z", 101, 99.5),
  candle("2026-12-31T00:00:00Z", 99.5, 110),
];

describe("toChartPoints", () => {
  it.each(["1d", "1w"] as const)("labels %s candles with UTC date and time", (period) => {
    expect(toChartPoints(candles, period)).toEqual([
      { t: "2026-03-04T09:05:00Z", label: "03/04 09:05", close: 101 },
      { t: "2026-03-04T23:30:00Z", label: "03/04 23:30", close: 99.5 },
      { t: "2026-12-31T00:00:00Z", label: "12/31 00:00", close: 110 },
    ]);
  });

  it.each(["1m", "3m", "1y"] as const)("labels %s candles with the UTC date only", (period) => {
    expect(toChartPoints(candles, period).map((p) => p.label)).toEqual(["03/04", "03/04", "12/31"]);
  });

  it("uses UTC even for offset timestamps", () => {
    const [point] = toChartPoints([candle("2026-03-04T23:30:00-02:00", 1, 1)], "1d");
    expect(point.label).toBe("03/05 01:30");
  });

  it("returns an empty list for no candles", () => {
    expect(toChartPoints([], "1m")).toEqual([]);
  });
});

describe("periodChange", () => {
  it("measures from the first open to the last close", () => {
    expect(periodChange(candles)).toEqual({ absolute: 10, percent: 10 });
  });

  it("reports a negative change", () => {
    const change = periodChange([candle("2026-03-04T00:00:00Z", 200, 190), candle("2026-03-05T00:00:00Z", 190, 150)]);
    expect(change).toEqual({ absolute: -50, percent: -25 });
  });

  it("handles a single candle", () => {
    expect(periodChange([candle("2026-03-04T00:00:00Z", 50, 50)])).toEqual({ absolute: 0, percent: 0 });
  });

  it("returns null when there are no candles", () => {
    expect(periodChange([])).toBeNull();
  });

  it("returns null when the first open is 0", () => {
    expect(periodChange([candle("2026-03-04T00:00:00Z", 0, 5)])).toBeNull();
  });
});
