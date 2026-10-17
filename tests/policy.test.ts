import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  const result: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) result.push(...walk(full));
    else if (full.endsWith(".ts")) result.push(full);
  }
  return result;
}

const FORBIDDEN: Array<{ label: string; pattern: RegExp }> = [
  {
    label: "vault write API",
    pattern: /\bvault\s*\.\s*(modify|create|delete|rename|append|process|trash|copy|write)\b/,
  },
  {
    label: "adapter write API",
    pattern: /\badapter\s*\.\s*(write|append|writeBinary|mkdir|remove|rename)\b/,
  },
  { label: "requestUrl network call", pattern: /\brequestUrl\s*\(/ },
  { label: "fetch network call", pattern: /\bfetch\s*\(/ },
  { label: "XMLHttpRequest", pattern: /\bXMLHttpRequest\b/ },
  { label: "WebSocket", pattern: /\bnew\s+WebSocket\b/ },
  { label: "setInterval polling", pattern: /\bsetInterval\s*\(/ },
  {
    label: "Electron or Node runtime imports",
    pattern: /from\s+["'](electron|node:fs|node:child_process)["']/,
  },
];

describe("plugin source policy", () => {
  const files = walk("src");

  it("finds the plugin sources", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it.each(FORBIDDEN)("never uses $label", ({ pattern }) => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const match = pattern.exec(source);
      if (match) {
        throw new Error(`${file} contains forbidden pattern: ${match[0]}`);
      }
    }
  });

  it("registers exactly one Bases view and one code block processor", () => {
    const main = readFileSync("src/main.ts", "utf8");
    expect(main.match(/registerBasesView\(/g)).toHaveLength(1);
    expect(main.match(/registerNoteSummaryProcessor\(/g)).toHaveLength(1);
  });
});
