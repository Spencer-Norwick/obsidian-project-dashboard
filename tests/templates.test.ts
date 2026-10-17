import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MILESTONE_PROPERTY_NAMES, PROJECT_PROPERTY_NAMES } from "../src/schema";

const ALLOWED_KEYS: Record<string, Set<string>> = {
  project: new Set<string>(PROJECT_PROPERTY_NAMES),
  milestone: new Set<string>(MILESTONE_PROPERTY_NAMES),
  deliverable: new Set(["type", "parent_project"]),
  task: new Set(["type", "parent_project", "done"]),
  goal: new Set(["type", "focus", "target", "done_when"]),
  capability: new Set(["type", "focus"]),
  practice: new Set(["type", "focus", "cadence"]),
  domain: new Set(["type"]),
  focus: new Set(["type", "domain"]),
  interest: new Set(["type"]),
};

function frontmatter(text: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!match || match[1] === undefined) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const key = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (key && key[1] !== undefined) {
      result[key[1]] = key[2] ?? "";
    }
  }
  return result;
}

describe("markdown templates", () => {
  const files = readdirSync("templates").filter((name) => name.endsWith(".md"));

  it.each(Object.keys(ALLOWED_KEYS))("ships a restrained template for %s", (entity) => {
    expect(files).toContain(`${entity}.md`);
  });

  it.each(files)("%s uses only canonical property names", (file) => {
    const entity = file.replace(/\.md$/, "");
    const allowed = ALLOWED_KEYS[entity];
    expect(allowed).toBeDefined();
    if (!allowed) return;
    const keys = Object.keys(frontmatter(readFileSync(join("templates", file), "utf8")));
    for (const key of keys) {
      expect(allowed.has(key)).toBe(true);
    }
  });

  it.each(files)("%s declares its own type", (file) => {
    const entity = file.replace(/\.md$/, "");
    const values = frontmatter(readFileSync(join("templates", file), "utf8"));
    expect(values.type).toBe(entity);
  });

  it("ships the summary code block inside the project template", () => {
    const project = readFileSync(join("templates", "project.md"), "utf8");
    expect(project).toContain("```project-summary");
  });
});
