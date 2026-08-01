// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { ApplyJourney } from "@/components/apply-journey";

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
