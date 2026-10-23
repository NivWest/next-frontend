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
});
