import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const bundle = readFileSync("main.js", "utf8");
const manifest = JSON.parse(readFileSync("manifest.json", "utf8")) as {
  id: string;
  version: string;
  minAppVersion: string;
};
const versions = JSON.parse(readFileSync("versions.json", "utf8")) as Record<string, string>;
const styles = readFileSync("styles.css", "utf8");

describe("published artifacts", () => {
  it("embeds no absolute local paths", () => {
    expect(bundle).not.toMatch(/\/Users\//);
    expect(bundle).not.toMatch(/\/home\//);
    expect(bundle).not.toMatch(/[A-Za-z]:\\\\/);
  });

  it("ships without source maps", () => {
    expect(bundle).not.toContain("sourceMappingURL");
    expect(bundle).not.toContain("sourceMappingURL=data:");
  });

  it("carries a generated-bundle banner pointing at the repository", () => {
    expect(bundle).toContain("github.com/Spencer-Norwick/obsidian-project-dashboard");
  });

  it("keeps manifest and versions.json consistent", () => {
    expect(manifest.id).toBe("project-dashboard");
    expect(versions[manifest.version]).toBe(manifest.minAppVersion);
  });

  it("ships the scoped stylesheet", () => {
    expect(styles).toContain(".project-dashboard");
    expect(styles).toContain(".pd-bar--proposed");
    expect(styles).not.toContain("@import");
  });
});
