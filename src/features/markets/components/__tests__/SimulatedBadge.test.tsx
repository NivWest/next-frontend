import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SimulatedBadge } from "../SimulatedBadge";

describe("SimulatedBadge", () => {
  it("shows the badge text with an explanatory title", () => {
    render(<SimulatedBadge />);

    const badge = screen.getByText("Simulated market data");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveAttribute(
      "title",
      "Prices come from TradeEdu's deterministic simulator, not a real exchange",
    );
  });

  it("appends a custom class name", () => {
    render(<SimulatedBadge className="ml-2" />);

    expect(screen.getByText("Simulated market data")).toHaveClass("ml-2", "rounded-full");
  });
});
