import { describe, expect, it } from "vitest";
import { toChartPoints } from "../types";

describe("toChartPoints", () => {
  it("maps ohlc points to M/D dates and close prices", () => {
    const ts = new Date(2026, 9, 21).getTime();
    expect(toChartPoints({ ohlc: [{ timestamp: ts, close: 187.5 }] })).toEqual([{ date: "10/21", price: 187.5 }]);
  });

  it("falls back to dataSeries values and an empty series", () => {
    const ts = new Date(2026, 0, 2).getTime();
    expect(toChartPoints({ dataSeries: [{ timestamp: ts, value: 42 }] })).toEqual([{ date: "1/2", price: 42 }]);
    expect(toChartPoints({})).toEqual([]);
  });
});
