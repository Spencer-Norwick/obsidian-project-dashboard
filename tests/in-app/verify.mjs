/**
 * In-app verification for Project Dashboard.
 *
 * Launches an ISOLATED Obsidian instance (own --user-data-dir, own CDP port)
 * that opens only the fictional demo vault, drives it over the Chrome
 * DevTools Protocol, and prints a pass/fail report. Your real Obsidian
 * profile and vaults are never read or modified.
 *
 * Usage:
 *   npm run build
 *   node tests/in-app/verify.mjs
 *
 * Environment:
 *   OBSIDIAN_BIN  path to the Obsidian binary (default: macOS install path)
 *   CDP_PORT      debug port for the isolated instance (default 9333)
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const vault = path.join(root, "demo-vault");
const shotsDir = path.join(root, "docs", "screenshots");
const profileDir = path.join(os.tmpdir(), "project-dashboard-verify-profile");
const port = Number(process.env.CDP_PORT ?? 9333);
const obsidianBin =
  process.env.OBSIDIAN_BIN ??
  ["/Applications/Obsidian.app/Contents/MacOS/Obsidian"].find((candidate) => existsSync(candidate));

if (!obsidianBin) {
  console.error("No Obsidian binary found; set OBSIDIAN_BIN.");
  process.exit(2);
}
if (
  !existsSync(path.join(root, "demo-vault", ".obsidian", "plugins", "project-dashboard", "main.js"))
) {
  console.error("Demo vault plugin not installed. Run: npm run demo:install");
  process.exit(2);
}

const failures = [];

// Never hang forever: a stuck CDP request or a blocked app fails the run.
const REQUEST_TIMEOUT_MS = 20000;
const watchdog = setTimeout(() => {
  console.error("verification timed out after 240s");
  process.exit(1);
}, 240000);
const record = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(name);
};

mkdirSync(shotsDir, { recursive: true });

// ---------------------------------------------------------------------------
// Isolated profile
// ---------------------------------------------------------------------------
mkdirSync(profileDir, { recursive: true });
writeFileSync(
  path.join(profileDir, "obsidian.json"),
  JSON.stringify({
    vaults: { pdverify000000001: { path: vault, ts: Date.now(), open: true } },
  }),
);

const child = spawn(
  obsidianBin,
  [`--user-data-dir=${profileDir}`, `--remote-debugging-port=${port}`],
  { detached: true, stdio: "ignore" },
);
child.unref();

async function waitForCdp() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((target) => target.type === "page");
      if (page) return page;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return null;
}

const page = await waitForCdp();
if (!page) {
  console.error("CDP endpoint did not come up; is another Obsidian instance using the port?");
  process.exit(2);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
const consoleExceptions = [];

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleExceptions.push(message.params?.exceptionDetails?.text ?? "exception");
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", reject);
});

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP request timed out: ${method}`));
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression, awaitPromise = false) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(`${result.exceptionDetails.text}: ${expression.slice(0, 100)}`);
  }
  return result.result?.value;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = async (expression, timeout = 25000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return true;
    await sleep(300);
  }
  return false;
};

const quitInstance = async () => {
  // Fire and forget: the renderer may go away before replying.
  send("Runtime.evaluate", {
    expression: "setTimeout(() => app.commands.executeCommandById('app:quit'), 50)",
  }).catch(() => undefined);
  await sleep(2500);
  try {
    ws.close();
  } catch {
    // already closed
  }
  try {
    process.kill(child.pid, "SIGTERM");
  } catch {
    // already exited
  }
};

await send("Runtime.enable");
await send("Page.enable");

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------
try {
  await waitFor("!!(app.workspace && app.workspace.activeLeaf)", 30000);
  // A fresh profile starts in restricted mode; enable community plugins for
  // this isolated instance only (equivalent to accepting the trust prompt).
  if (!(await evaluate("!!app.plugins.plugins['project-dashboard']"))) {
    await evaluate("app.plugins.setEnable(true)", true).catch(() => undefined);
    await evaluate("app.plugins.loadManifests()", true).catch(() => undefined);
    await evaluate("app.plugins.enablePlugin('project-dashboard')", true).catch(() => undefined);
    await sleep(800);
    // Close the restricted-mode dialog if it is still on screen.
    await evaluate(
      "(() => { document.querySelector('.modal-close-button')?.click(); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); return true; })()",
    );
    await sleep(400);
  }
  record(
    "vault is the fictional demo vault",
    (await evaluate("app.vault.getName()")) === "demo-vault",
  );
  record("plugin is loaded", await waitFor("!!app.plugins.plugins['project-dashboard']", 25000));

  await evaluate("app.workspace.openLinkText('Dashboard', '', false)", true);
  await sleep(600);
  await evaluate(
    "(() => { const leaf = app.workspace.activeLeaf; if (leaf?.view?.getMode?.() === 'source') app.commands.executeCommandById('markdown:toggle-preview'); return true; })()",
    true,
  );
  const rendered = await waitFor(
    "!!document.querySelector('.markdown-preview-view .project-dashboard .pd-bar')",
  );
  record("timeline renders inside the Base embed", rendered);

  const measure = `(() => {
  const root = document.querySelector('.markdown-preview-view .project-dashboard');
  if (!root) return null;
  return {
    bars: [...root.querySelectorAll('.pd-bar')].map((bar) => {
      const fill = bar.querySelector('.pd-bar-fill');
      const track = bar.closest('.pd-row-track');
      const brect = bar.getBoundingClientRect();
      const trect = track.getBoundingClientRect();
      return {
        path: bar.getAttribute('data-project-path'),
        left: Math.round(brect.left - trect.left),
        width: Math.round(brect.width),
        fill: fill ? fill.style.width : null,
      };
    }),
    cells: [...root.querySelectorAll('.pd-cell')].map((cell) => cell.textContent),
    milestones: root.querySelectorAll('.pd-milestone').length,
    warnings: root.querySelectorAll('.pd-warnings .pd-list-item').length,
    needs: root.querySelectorAll('.pd-needs .pd-list-item').length,
    todayLeft: root.querySelector('.pd-today')?.style.left ?? null,
  };
})()`;

  const before = await evaluate(measure);
  if (!before) {
    console.error("FAIL timeline DOM could not be measured");
    await evaluate("app.commands.executeCommandById('app:quit')", true).catch(() => undefined);
    process.exit(1);
  }
  record(
    "six bars and four milestones render",
    before?.bars.length === 6 && before?.milestones === 4,
  );
  record(
    "missing/invalid data is reported non-fatally",
    before?.warnings === 5 && before?.needs === 1,
    `${before?.warnings} warnings, ${before?.needs} needs-dates`,
  );
  record(
    "focus strip is derived",
    before?.cells?.[0]?.includes("Autumn regatta logistics") &&
      before?.cells?.[2]?.includes("Dry fit"),
  );

  // Capture the dashboard while it is still the visible view.
  try {
    const dark = await evaluate("document.body.classList.contains('theme-dark')");
    await capture(
      dark ? "obsidian-dashboard-dark" : "obsidian-dashboard-light",
      ".markdown-preview-view .project-dashboard:not(.pd-note)",
    );
  } catch (error) {
    console.log("screenshot capture skipped:", String(error).slice(0, 120));
  }

  // Live update + geometry checks (editing a fictional demo note, then restore).
  const notePath = path.join(vault, "Boathouse/Projects/Refit the training singles.md");
  const original = readFileSync(notePath, "utf8");
  try {
    writeFileSync(notePath, original.replace("progress: 55", "progress: 75"));
    record(
      "progress edits update the bar live",
      await waitFor(
        "document.querySelector('.markdown-preview-view .pd-bar[data-project-path$=\"Refit the training singles.md\"] .pd-bar-fill')?.style.width === '75%'",
        15000,
      ),
    );

    const refitBefore = before.bars.find((bar) =>
      bar.path?.endsWith("Refit the training singles.md"),
    );
    writeFileSync(
      notePath,
      readFileSync(notePath, "utf8").replace("phase: Hull repair", "phase: Keel assembly"),
    );
    await sleep(1200);
    const afterPhase = await evaluate(measure);
    const refitAfterPhase = afterPhase.bars.find((bar) =>
      bar.path?.endsWith("Refit the training singles.md"),
    );
    record(
      "bar geometry ignores non-date properties",
      refitBefore.left === refitAfterPhase.left && refitBefore.width === refitAfterPhase.width,
    );

    writeFileSync(
      notePath,
      readFileSync(notePath, "utf8").replace("target: 2026-11-13", "target: 2026-11-20"),
    );
    await sleep(1500);
    const afterTarget = await evaluate(measure);
    const refitAfterTarget = afterTarget.bars.find((bar) =>
      bar.path?.endsWith("Refit the training singles.md"),
    );
    record(
      "target edits move the bar by exactly seven days",
      refitAfterTarget.width - refitBefore.width === 98,
      `${refitBefore.width}px → ${refitAfterTarget.width}px`,
    );
  } finally {
    writeFileSync(notePath, original);
    await sleep(1200);
  }

  // No-write audit.
  const snapshotMtimes = (dir) => {
    const result = {};
    const walk = (current) => {
      for (const name of readdirSync(current)) {
        const full = path.join(current, name);
        const stats = statSync(full);
        if (stats.isDirectory()) {
          if (name !== ".obsidian") walk(full);
        } else {
          result[full] = stats.mtimeMs;
        }
      }
    };
    walk(dir);
    return result;
  };
  const mtimesA = snapshotMtimes(vault);
  await sleep(2500);
  const mtimesB = snapshotMtimes(vault);
  const changed = Object.keys(mtimesA).filter((file) => mtimesA[file] !== mtimesB[file]);
  record("plugin performs no vault writes", changed.length === 0, changed.join(", "));

  // Note summary.
  await evaluate(
    "app.workspace.openLinkText('Boathouse/Projects/Refit the training singles', '', false)",
    true,
  );
  await sleep(700);
  await evaluate(
    "(() => { const leaf = app.workspace.activeLeaf; if (leaf?.view?.getMode?.() === 'source') app.commands.executeCommandById('markdown:toggle-preview'); return true; })()",
    true,
  );
  const summaryRendered = await waitFor(
    "!!document.querySelector('.markdown-preview-view .pd-note .pd-ns-props')",
  );
  record("project summary reflects the note", summaryRendered);

  // Screenshot helper (declared as a function so it hoists for the call above).
  async function capture(name, selector) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1500,
      height: 1400,
      deviceScaleFactor: 1.25,
      mobile: false,
    }).catch(() => undefined);
    await sleep(600);
    await evaluate(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
    const el = els.find((candidate) => candidate.getBoundingClientRect().width > 0) ?? els[0];
    if (el) el.scrollIntoView({ block: 'start' });
    return !!el;
  })()`);
    await sleep(400);
    const rect = await evaluate(`(() => {
    const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
    const el = els.find((candidate) => candidate.getBoundingClientRect().width > 0) ?? els[0];
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  })()`);
    const innerWidth = await evaluate("innerWidth");
    if (!rect) return;
    const shot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
    await send("Emulation.clearDeviceMetricsOverride").catch(() => undefined);
    writeFileSync(path.join(shotsDir, `${name}.png`), Buffer.from(shot.data, "base64"));
    execFileSync("python3", [
      "-c",
      `from PIL import Image
img = Image.open(${JSON.stringify(path.join(shotsDir, `${name}.png`))})
scale = img.size[0] / ${innerWidth}
crop = img.crop((round(${rect.x} * scale), round(${rect.y} * scale), round((${rect.x + rect.width}) * scale), round((${rect.y + rect.height}) * scale)))
crop.save(${JSON.stringify(path.join(shotsDir, `${name}.png`))})`,
    ]);
    console.log(`SHOT docs/screenshots/${name}.png`);
  }

  record(
    "no console exceptions during the run",
    consoleExceptions.length === 0,
    consoleExceptions.slice(0, 2).join("; "),
  );

  await quitInstance();
} catch (error) {
  console.error("verification aborted:", error);
  await quitInstance();
  clearTimeout(watchdog);
  process.exit(1);
}

clearTimeout(watchdog);
if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nAll in-app checks passed.");
