import { describe, expect, it } from "vitest";
import { formatMoney, formatPercent, formatQuantity } from "../format";

describe("formatMoney", () => {
  it("defaults to SEK with thousands separators and two decimals", () => {
    expect(formatMoney(100000)).toBe("100,000.00 SEK");
  });

  it("uses the given currency", () => {
    expect(formatMoney(-5.5, "USD")).toBe("-5.50 USD");
    expect(formatMoney(1234567.891, "EUR")).toBe("1,234,567.89 EUR");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("0.00 SEK");
  });

  it("rounds 0.005 up to the next hundredth", () => {
    expect(formatMoney(0.005)).toBe("0.01 SEK");
    expect(formatMoney(-0.005)).toBe("-0.01 SEK");
    expect(formatMoney(0.004)).toBe("0.00 SEK");
  });
});

describe("formatPercent", () => {
  it("prefixes positive values with a plus sign", () => {
    expect(formatPercent(1.25)).toBe("+1.25%");
  });

  it("keeps the minus sign on negative values", () => {
    expect(formatPercent(-0.5)).toBe("-0.50%");
  });

  it("formats zero without a sign", () => {
    expect(formatPercent(0)).toBe("0.00%");
    expect(formatPercent(-0)).toBe("0.00%");
  });

  it("drops the sign when a tiny value rounds to zero", () => {
    expect(formatPercent(0.004)).toBe("0.00%");
    expect(formatPercent(-0.004)).toBe("0.00%");
  });

  it("rounds 0.005 up to the next hundredth", () => {
    expect(formatPercent(0.005)).toBe("+0.01%");
    expect(formatPercent(-0.005)).toBe("-0.01%");
  });

  it("adds thousands separators to large values", () => {
    expect(formatPercent(1234.5)).toBe("+1,234.50%");
  });
});

describe("formatQuantity", () => {
  it("drops trailing zeros and keeps up to 4 decimals", () => {
    expect(formatQuantity(10)).toBe("10");
    expect(formatQuantity(0.5)).toBe("0.5");
    expect(formatQuantity(0.1234)).toBe("0.1234");
  });

  it("rounds beyond 4 decimals and adds thousands separators", () => {
    expect(formatQuantity(1234.12345)).toBe("1,234.1235");
  });
});
