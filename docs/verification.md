# Verification

## Automated checks

Run everything with one command:

```sh
npm run check
```

which performs, in order:

| Step           | What it proves                                              |
| -------------- | ----------------------------------------------------------- |
| `format:check` | Repository formatting is consistent (Prettier).             |
| `lint`         | ESLint (typescript-eslint) passes.                          |
| `typecheck`    | Strict TypeScript compiles against `obsidian@1.14.4` types. |
| `build`        | Production esbuild bundle succeeds (`main.js`).             |
| `test`         | The full Vitest suite, including the checks below.          |

The test suite covers:

- **Schema/acceptance** (`tests/schema.test.ts`) — the canonical schema
  documented in `docs/schema.md` matches the code.
- **Dates** (`tests/dates.test.ts`) — `YYYY-MM-DD` parsing, local-date
  arithmetic, leap years, and day-shift immunity across time zones.
- **Normalization** (`tests/model.test.ts`) — statuses, attention, schedule
  state, priorities, progress clamping, missing/invalid dates, milestone
  parenting, hidden completed items, empty datasets.
- **Selection rules** (`tests/select.test.ts`) — finish first, hard deadline,
  next milestone, ties, `+N` counts, and empty states.
- **Scaling** (`tests/scale.test.ts`) — automatic week/month switching, padded
  ranges, tick labels, bar geometry, minimum bar width, today placement.
- **Integration fixture** (`tests/fixtures/entries.ts` + `tests/render*.test.ts`)
  — Bases-entry-shaped objects for every edge case, rendered through the real
  DOM renderers with assertions on positions, milestones, warnings, hidden
  items, and click-to-open behavior.
- **Policy** (`tests/policy.test.ts`) — no vault writes, no network calls, no
  polling, no Electron/Node imports in the plugin sources.
- **Artifacts** (`tests/dist.test.ts`) — the built bundle embeds no absolute
  paths and no source maps; `manifest.json` and `versions.json` agree.
- **Repo sync** (`tests/sync.test.ts`) — the canonical Base and templates are
  byte-identical to their copies in the demo vault.

## Screenshots

The `obsidian-*.png` screenshots in `docs/screenshots/` were captured from a
real Obsidian 1.14.4 instance running the fictional demo vault (light theme,
dark theme, a narrow pane, and the note summary), using the isolated-profile
procedure described under "In-app verification".

The `dashboard-*.png` and `note-summary-*.png` shots are produced by a small
Chromium harness that loads the plugin's real renderers (the same modules the
Bases view calls) with the fictional demo data and the real `styles.css`:

```sh
npm run screenshots   # requires a local Chrome/Chromium; set CHROME_BIN if
                      # it is not at the default macOS or Linux location
```

The harness approximates Obsidian's default theme variables for light and
dark; it is a convenience, not a substitute for the app.

## Manual visual verification checklist (inside Obsidian 1.14.4+)

Open the demo vault (`npm run demo:install`, then open `demo-vault/` and
`Dashboard.md`) and confirm:

- [ ] Light theme: the timeline, focus strip, and legend render with readable
      contrast; committed bars are solid, proposed bars are striped.
- [ ] Dark theme: same checklist, no unreadable text, no clashing colors.
- [ ] Weeks scale shows one labeled tick per week; switching the Scale option
      to Months reflows the same data into month ticks.
- [ ] Narrow pane (drag the pane to ~400 px or open the Base beside a sidebar):
      the focus strip stacks, the label column narrows, the track scrolls
      horizontally, and nothing overlaps.
- [ ] Editing a fictional note — change `progress: 55` to `75` in
      `Projects/Refit the training singles` — updates the bar fill live.
- [ ] Changing `target` on `Projects/Autumn regatta logistics` moves its bar's
      right edge and re-positions the "Regatta day" milestone marker.
- [ ] Clicking a bar or a project name opens that note; clicking a milestone
      diamond opens the milestone note.
- [ ] `Projects/Solar bench retrofit`: neutral (gray) bar, progress fill at
      100%, and two warnings naming `in-review` and `140`.
- [ ] `Projects/Paint the west stair`: no bar; one warning naming both dates.
- [ ] `Projects/Recatalog the map cabinet`: listed under "Needs dates".
- [ ] `Milestones/Book the speaker`: listed in warnings with its missing
      parent name.
- [ ] Toggling "Show completed and cancelled" reveals the green
      `Summer open house` bar and the muted `Second launch ramp` bar.
- [ ] The `project-summary` block on `Projects/Refit the training singles`
      matches the note's own properties; edit a property and watch it update.
- [ ] Disable the plugin: `Projects.base` still shows its Table view and notes
      render as ordinary Markdown.
- [ ] While editing notes, confirm no file in the vault is modified by the
      plugin (no new timestamps, no frontmatter changes).

## In-app verification

In-app verification was performed against a real Obsidian 1.14.4 install
(`/Applications/Obsidian.app`, core update asar 1.14.4) using an **isolated
profile**: the app was launched with
`--user-data-dir=<temp dir> --remote-debugging-port=<port>` and a temporary
`obsidian.json` that opens only the fictional demo vault. The user's own
Obsidian configuration was never touched.

The scripted run (`tests/in-app/verify.mjs`) observed:

| Check                                           | Result                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Plugin loads and registers the Bases view       | Passed (`ProjectDashboardPlugin`, no load-order race)                                                                     |
| Timeline renders in the embedded Base           | Passed — 6 bars, 4 milestone markers, weeks scale                                                                         |
| Bar geometry derives only from `start`/`target` | Passed — phase-text edit did not move the bar; `target +7d` widened it by exactly 98 px (7 × 14 px/day)                   |
| Live updates on property change                 | Passed — `progress 55 → 75` reflected without reload                                                                      |
| Focus strip is derived                          | Passed — Finish first `Autumn regatta logistics +1`, Hard deadline `Oct 30`, Next milestone `Dry fit +4`                  |
| Missing/invalid data is non-fatal and explained | Passed — 5 warnings and 1 Needs-dates item, matching the unit tests exactly                                               |
| `project-summary` block reflects the note       | Passed — chip `Active · committed · finish first`, rows for Progress/Start/Target/Phase/Domain/Focus/Priority/Next review |
| Plugin performs no vault writes                 | Passed — zero file mtimes changed during a render window                                                                  |
| No runtime errors during normal use             | Passed — zero console exceptions during the whole run                                                                     |

Two real issues were found by this run and fixed in the plugin before release:

1. On a profile where community plugins load before the Bases core plugin is
   enabled, `registerBasesView` silently fails; the plugin now retries once on
   `workspace.onLayoutReady` and warns if Bases is unavailable.
2. Bases returns `NullValue` for empty properties, whose string form is
   `"null"`; the adapter now treats `"null"`/`"undefined"` as missing values
   instead of reporting a confusing invalid-date warning.

To re-run the isolated in-app verification on a Mac with Obsidian installed:

```sh
npm ci && npm run build
node tests/in-app/verify.mjs         # builds into demo-vault, launches an
                                     # isolated instance, prints results
```

The manual checklist above remains the reference for human review inside a
normal vault; everything in it that the scripted run covers is marked above,
and theme/layout review is covered by both the in-app screenshots and the
harness.
