// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { ApplyJourney } from "@/components/apply-journey";
import { AdvocateInviteForm } from "@/components/advocate-invite-form";

afterEach(cleanup);

describe("accessible foundation flow", () => {
  it("has no automatically detectable WCAG violations", async () => {
    const { container } = render(<main><h1>Apply</h1><ApplyJourney title="Written request" /></main>);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it("requires explicit review before export", () => {
    render(<main><h1>Apply</h1><ApplyJourney title="Written request" /></main>);
    const exportButton = screen.getByRole("button", { name: "Print or save as PDF" });
    expect((exportButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/I have reviewed/));
    expect((exportButton as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("Phase 3 forms", () => {
  it("has no automatically detectable violations in the advocate invitation form", async () => {
    const { container } = render(<main><h1>Advocate invitation</h1><AdvocateInviteForm /></main>);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it("uses explicit labels, a fieldset, and a live status region", () => {
    render(<main><h1>Advocate invitation</h1><AdvocateInviteForm /></main>);
    expect(screen.getByRole("group", { name: "What can they do?" })).toBeTruthy();
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByLabelText("Access expires")).toBeTruthy();
  });
});
