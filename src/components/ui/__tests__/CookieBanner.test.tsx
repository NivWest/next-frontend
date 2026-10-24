import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CookieBanner } from "../CookieBanner";
import { useUIStore } from "@/store/useUIStore";

describe("CookieBanner", () => {
  beforeEach(() => {
    useUIStore.setState({ cookieConsentDismissed: false });
  });

  it("shows the consent banner until the user saves preferences", () => {
    render(<CookieBanner />);
    expect(screen.getByText("Cookie Preferences")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Preferences" }));

    expect(useUIStore.getState().cookieConsentDismissed).toBe(true);
  });

  it("is exposed as the 'Cookie preferences' region", () => {
    render(<CookieBanner />);

    const region = screen.getByRole("region", { name: "Cookie preferences" });
    expect(region).toHaveTextContent("Cookie Preferences");
    expect(region).toContainElement(screen.getByRole("button", { name: "Accept All" }));
  });

  it("anchors as a bottom-right card from md up so it cannot cover the sidebar", () => {
    render(<CookieBanner />);

    const region = screen.getByRole("region", { name: "Cookie preferences" });
    expect(region).toHaveClass("md:left-auto", "md:right-6", "md:max-w-md");
  });

  it("dismisses when the user accepts all cookies", () => {
    render(<CookieBanner />);

    fireEvent.click(screen.getByRole("button", { name: "Accept All" }));

    expect(useUIStore.getState().cookieConsentDismissed).toBe(true);
  });

  it("renders nothing once consent is dismissed", () => {
    useUIStore.setState({ cookieConsentDismissed: true });
    render(<CookieBanner />);

    expect(screen.queryByRole("region", { name: "Cookie preferences" })).not.toBeInTheDocument();
  });
});
