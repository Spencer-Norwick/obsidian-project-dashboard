import { describe, expect, it, vi } from "vitest";
import { renderNoteSummary } from "../src/render-note";
import { noteSummaryValues } from "./fixtures/entries";

function render(values: Record<string, unknown> | undefined) {
  const container = document.createElement("div");
  const openLink = vi.fn();
  renderNoteSummary(container, {
    name: "Refit the training singles",
    values,
    interactions: { openLink },
  });
  return { container, openLink };
}

const PROJECT_VALUES: Record<string, unknown> = noteSummaryValues();

function valueMap(container: HTMLElement): Map<string, string> {
  const rows = [...container.querySelectorAll(".pd-ns-row")];
  const map = new Map<string, string>();
  for (const row of rows) {
    const key = row.querySelector(".pd-ns-key")?.textContent ?? "";
    const value = row.querySelector(".pd-ns-value")?.textContent ?? "";
    map.set(key, value);
  }
  return map;
}

describe("note summary", () => {
  it("reflects the current note's native properties", () => {
    const { container } = render(PROJECT_VALUES);
    const chip = container.querySelector(".pd-ns-chip")?.textContent ?? "";
    expect(chip).toContain("Active");
    expect(chip).toContain("committed");
    expect(chip).toContain("finish first");

    const values = valueMap(container);
    expect(values.get("Progress")).toBe("55%");
    expect(values.get("Start")).toBe("2026-10-05");
    expect(values.get("Target")).toBe("2026-11-13");
    expect(values.get("Phase")).toBe("Hull repair");
    expect(values.get("Priority")).toBe("High");
    expect(values.get("Next review")).toBe("2026-10-20");

    const panels = container.querySelector(".pd-ns-focus");
    expect(panels?.textContent).toContain("Next action");
    expect(panels?.textContent).toContain("Bolt the keel plate");
    expect(container.querySelector(".pd-ns-columns")?.textContent).toContain("Done when");
    expect(container.querySelector(".pd-ns-columns")?.textContent).toContain(
      "Hull passes the leak check",
    );
  });

  it("marks a hard deadline next to the target date", () => {
    const { container } = render({ ...PROJECT_VALUES, hard_deadline: true });
    expect(valueMap(container).get("Target")).toBe("2026-11-13 · hard deadline");
  });

  it("shows a neutral chip and a hint for an unknown status", () => {
    const { container } = render({ ...PROJECT_VALUES, status: "in-review" });
    expect(container.querySelector(".pd-ns-chip")?.textContent).toContain("in-review");
    expect(container.querySelector(".pd-ns-hint")?.textContent).toContain(
      'Unknown status "in-review"',
    );
  });

  it("shows the clamped progress with a hint for invalid values", () => {
    const { container } = render({ ...PROJECT_VALUES, progress: 140 });
    expect(valueMap(container).get("Progress")).toBe("100%");
    expect(container.querySelector(".pd-ns-panel .pd-ns-hint")?.textContent).toContain(
      "shown as 100",
    );
  });

  it("renders domain and focus as internal links that open through the callback", () => {
    const { container, openLink } = render(PROJECT_VALUES);
    const links = [...container.querySelectorAll<HTMLAnchorElement>(".pd-ns-value .pd-link")];
    expect(links.map((link) => link.textContent)).toEqual(["Harborline Boathouse", "Fleet upkeep"]);
    links[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
    expect(openLink).toHaveBeenCalledWith("Harborline Boathouse", expect.anything());
  });

  it("invites the user to add properties when the note is not a project", () => {
    const { container } = render({ title: "Something else" });
    expect(container.querySelector(".pd-ns-empty")?.textContent).toContain("type: project");
    const missing = render(undefined);
    expect(missing.container.querySelector(".pd-ns-empty")).not.toBeNull();
  });
});
