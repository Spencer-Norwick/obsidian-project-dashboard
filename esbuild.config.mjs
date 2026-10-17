import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const production = process.argv.includes("production");
const installIntoDemoVault = process.argv.includes("demo");

const banner = `/*
Project Dashboard - generated bundle. Do not edit by hand.
Source: https://github.com/Spencer-Norwick/obsidian-project-dashboard
Build command: npm run build
*/`;

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  banner: { js: banner },
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
  ],
  format: "cjs",
  platform: "browser",
  target: "es2022",
  logLevel: "info",
  // Production builds ship without source maps so no local paths are embedded
  // in the published artifact.
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}

if (installIntoDemoVault) {
  const target = path.join("demo-vault", ".obsidian", "plugins", "project-dashboard");
  fs.mkdirSync(target, { recursive: true });
  for (const file of ["main.js", "manifest.json", "styles.css"]) {
    fs.copyFileSync(file, path.join(target, file));
  }
  console.log(`Installed build into ${target}`);
}
