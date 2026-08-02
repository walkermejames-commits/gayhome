// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { AccessibilityPreferencesForm } from "@/components/accessibility-preferences";

afterEach(() => { cleanup(); sessionStorage.clear(); });

describe("Phase 6 accessibility preferences", () => {
  it("has no automatically detectable WCAG violations", async () => { const { container } = render(<main><h1>Accessibility preferences</h1><AccessibilityPreferencesForm /></main>); expect((await axe.run(container)).violations).toEqual([]); });
  it("is keyboard-operable and saves only presentation preferences in the tab", () => { render(<main><h1>Accessibility preferences</h1><AccessibilityPreferencesForm /></main>); fireEvent.click(screen.getByLabelText("easy Read")); fireEvent.click(screen.getByRole("button", { name: "Save for this tab" })); const stored=sessionStorage.getItem("navigator_accessibility_preferences_v1")??""; expect(stored).toContain('"easyRead":true'); expect(stored).not.toMatch(/case|token|diagnosis/i); expect(screen.getByRole("status").textContent).toContain("saved"); });
});
