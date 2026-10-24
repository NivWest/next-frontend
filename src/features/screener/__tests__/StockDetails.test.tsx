import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StockDetails } from "../components/StockDetails";

const apiMock = vi.fn();
vi.mock("@/lib/api", () => ({
  api: (endpoint: string) => apiMock(endpoint),
}));

function respondWith(details: unknown): void {
  apiMock.mockImplementation((endpoint: string) =>
    Promise.resolve(endpoint.startsWith("stocks/details") ? details : { ohlc: [] }),
  );
}

describe("StockDetails", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("renders inline with the instrument name and a link back to Markets", async () => {
    respondWith({ name: "Fjord Industries", company: { description: "Makes fjords." } });
    render(<StockDetails orderBookId="5361" />);

    expect(await screen.findByRole("heading", { level: 1, name: "Fjord Industries" })).toBeInTheDocument();
    expect(screen.getByText("Makes fjords.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Markets" })).toHaveAttribute("href", "/markets");
    expect(screen.getByRole("button", { name: "Add to Watchlist" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledWith("stocks/details?orderbookID=5361");
    expect(apiMock).toHaveBeenCalledWith("stocks/chart?orderbookID=5361&timePeriod=one_month");
  });

  it("falls back to 'Instrument <id>' when the details carry no name", async () => {
    respondWith({ company: { description: "Nameless." } });
    render(<StockDetails orderBookId="42" />);

    await screen.findByText("Nameless.");
    expect(screen.getByRole("heading", { level: 1, name: "Instrument 42" })).toBeInTheDocument();
  });

  it("shows an inline error when loading fails", async () => {
    apiMock.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<StockDetails orderBookId="42" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load stock details");
    expect(screen.getByRole("link", { name: "Back to Markets" })).toBeInTheDocument();
  });
});
