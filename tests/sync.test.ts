import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("canonical files stay in sync with the demo vault", () => {
  it("ships an identical Base file", () => {
    const canonical = readFileSync("bases/Projects.base", "utf8");
    const demoCopy = readFileSync("demo-vault/Projects.base", "utf8");
    expect(demoCopy).toBe(canonical);
  });

  it("declares a timeline view and a native table view", () => {
    const canonical = readFileSync("bases/Projects.base", "utf8");
    expect(canonical).toContain("type: project-timeline");
    expect(canonical).toContain("type: table");
    expect(canonical).toContain('type == "project"');
    expect(canonical).toContain('type == "milestone"');
    expect(canonical).toContain('file.inFolder("Templates")');
  });

  it("keeps every template identical between templates/ and the demo vault", () => {
    const templates = readdirSync("templates").filter((name) => name.endsWith(".md"));
    expect(templates.length).toBeGreaterThanOrEqual(10);
    for (const name of templates) {
      const canonical = readFileSync(join("templates", name), "utf8");
      const demoCopy = readFileSync(join("demo-vault", "Templates", name), "utf8");
      expect(demoCopy).toBe(canonical);
    }
  });
});
