/**
 * Renders the plugin's real view code with fictional demo data in headless
 * Chromium and writes the screenshots used in docs/ and README.md.
 *
 * Usage: npm run screenshots  (set CHROME_BIN when Chrome is not in the
 * default macOS or Linux location)
 */
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const outDir = path.join(root, "tests", "visual", "out");
const shotsDir = path.join(root, "docs", "screenshots");
mkdirSync(outDir, { recursive: true });
mkdirSync(shotsDir, { recursive: true });

await build({
  entryPoints: [path.join(root, "tests", "visual", "harness-entry.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  outfile: path.join(outDir, "harness.js"),
  logLevel: "silent",
});

const styles = readFileSync(path.join(root, "styles.css"), "utf8");
const harness = readFileSync(path.join(outDir, "harness.js"), "utf8");

const THEMES = {
  light: `
    --background-primary: #ffffff;
    --background-secondary: #f2f3f5;
    --background-modifier-border: #e0e0e0;
    --text-normal: #2e3338;
    --text-muted: #5c5c5c;
    --text-faint: #999999;
    --text-accent: #705dcf;
    --interactive-accent: #705dcf;
    --text-on-accent: #ffffff;
    --color-red: #e93147;
    --color-orange: #ec7500;
    --color-yellow: #e0ac00;
    --color-green: #08b94e;
    --color-blue: #086ddd;
    --color-purple: #7852ee;
    --color-cyan: #00bfbc;
  `,
  dark: `
    --background-primary: #1e1e1e;
    --background-secondary: #262626;
    --background-modifier-border: #363636;
    --text-normal: #dadada;
    --text-muted: #b3b3b3;
    --text-faint: #8a8a8a;
    --text-accent: #a882ff;
    --interactive-accent: #a882ff;
    --text-on-accent: #1e1e1e;
    --color-red: #fb464c;
    --color-orange: #e9973f;
    --color-yellow: #e0de71;
    --color-green: #44cf6e;
    --color-blue: #027aff;
    --color-purple: #a882ff;
    --color-cyan: #53dfdd;
  `,
};

const SHOTS = [
  {
    name: "dashboard-light-weeks",
    theme: "light",
    width: 1500,
    height: 540,
    request: { variant: "timeline", dataset: "core", scale: "automatic", showCompleted: false },
  },
  {
    name: "dashboard-dark-months",
    theme: "dark",
    width: 1240,
    height: 860,
    request: { variant: "timeline", dataset: "full", scale: "months", showCompleted: false },
  },
  {
    name: "dashboard-narrow",
    theme: "light",
    width: 430,
    height: 700,
    request: {
      variant: "timeline",
      dataset: "core",
      scale: "automatic",
      showCompleted: false,
      scrollToISO: "2026-10-16",
    },
  },
  {
    name: "note-summary-light",
    theme: "light",
    width: 900,
    height: 520,
    request: { variant: "note", dataset: "core", scale: "automatic", showCompleted: false },
  },
  {
    name: "note-summary-dark",
    theme: "dark",
    width: 900,
    height: 520,
    request: { variant: "note", dataset: "core", scale: "automatic", showCompleted: false },
  },
];

function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((candidate) => typeof candidate === "string");
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const chrome = findChrome();
if (chrome === null) {
  console.error(
    "No Chrome/Chromium found. Install one or point CHROME_BIN at the binary to regenerate screenshots.",
  );
  process.exit(1);
}

const today = { year: 2026, month: 10, day: 16 };
const profileDir = path.join(outDir, "chrome-profile");

for (const shot of SHOTS) {
  const request = { today, ...shot.request };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
:root {
${THEMES[shot.theme]}
}
html, body {
  margin: 0;
  padding: 0;
  background: var(--background-secondary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--text-normal);
}
body {
  width: ${shot.width}px;
  box-sizing: border-box;
  padding: 16px;
}
#harness-root {
  display: block;
}
${styles}
</style>
</head>
<body class="theme-${shot.theme}">
<div id="harness-root"></div>
<script>
${harness}
window.renderHarness(${JSON.stringify(request)}, document.getElementById("harness-root"));
</script>
</body>
</html>
`;

  const htmlPath = path.join(outDir, `${shot.name}.html`);
  writeFileSync(htmlPath, html);
  const result = spawnSync(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--force-color-profile=srgb",
      "--virtual-time-budget=2000",
      "--force-device-scale-factor=2",
      `--user-data-dir=${profileDir}`,
      `--window-size=${shot.width},${shot.height}`,
      `--screenshot=${path.join(shotsDir, `${shot.name}.png`)}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error(`Screenshot failed for ${shot.name} (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log(`Wrote docs/screenshots/${shot.name}.png`);
}
