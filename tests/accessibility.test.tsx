// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { ApplyJourney } from "@/components/apply-journey";
import { AdvocateInviteForm } from "@/components/advocate-invite-form";
import { CohortForm, CreatePilotForm, FeedbackForm, FeatureFlagForm, IncidentForm, SupportTicketForm } from "@/components/operational-forms";

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

describe("Phase 5 operational forms", () => {
  for (const [name, Component] of [["pilot setup", CreatePilotForm], ["support centre", SupportTicketForm], ["feedback", FeedbackForm]] as const) {
    it(`${name} has no automatically detectable WCAG violations`, async () => {
      const { container } = render(<main><h1>{name}</h1><Component /></main>);
      expect((await axe.run(container)).violations).toEqual([]);
    });
  }

  it("uses separate labelled feedback controls and an anonymous choice", () => {
    render(<main><h1>Feedback</h1><FeedbackForm /></main>);
    expect(screen.getByLabelText("Feedback type")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Rating (optional)" })).toBeTruthy();
    expect(screen.getByLabelText("Submit anonymously")).toBeTruthy();
  });

  it("has no detectable violations in cohort, feature and incident administration", async () => {
    const { container } = render(<main><h1>Operations</h1><CohortForm pilotId="00000000-0000-4000-8000-000000000000"/><FeatureFlagForm/><IncidentForm/></main>);
    expect((await axe.run(container)).violations).toEqual([]);
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
