# Architecture

Project Dashboard is a small read-only Obsidian plugin. Two registrations do
all of the work at startup:

1. **A Bases custom view** (`type: project-timeline`) that renders a
   horizontal project timeline from the entries of a `.base` file.
2. **A Markdown code block processor** (`project-summary`) that renders a
   compact summary from the current note's own frontmatter.

Nothing else happens on load: no vault scans, no timers, no network calls, no
background work.

## Module map

| Module                | Responsibility                                                                   |
| --------------------- | -------------------------------------------------------------------------------- |
| `src/main.ts`         | Plugin entry; registers the Bases view and the code block processor.             |
| `src/view.ts`         | `ProjectTimelineView extends BasesView`; maps Bases entries, calls the renderer. |
| `src/adapter.ts`      | Normalizes Bases `Value`s and file info into plain rows.                         |
| `src/model.ts`        | Schema-aware normalization, validation, warnings, selection inputs.              |
| `src/select.ts`       | Derived focus strip rules (finish first, hard deadline, next milestone).         |
| `src/scale.ts`        | Timeline geometry: range, week/month scale, ticks, bar rects.                    |
| `src/render.ts`       | Dashboard DOM rendering (pure DOM; no Obsidian imports).                         |
| `src/render-note.ts`  | Note summary DOM rendering (pure DOM; no Obsidian imports).                      |
| `src/note-summary.ts` | Code block processor glue: reads frontmatter via `MetadataCache`.                |
| `src/dates.ts`        | Local calendar-date parsing and arithmetic; never shifts days across zones.      |
| `src/schema.ts`       | Canonical property names, enums, defaults; guarded by `tests/schema.test.ts`.    |

The renderers and all model logic are free of Obsidian runtime imports, which
is what lets the test suite and the visual harness exercise the exact code the
plugin runs inside the app.

## Data flow

```text
Projects.base  ──filter──▶  BasesQueryResult.data (BasesEntry[])
                                   │  entry.getValue("note.<property>")
                                   ▼
                        adapter.ts → RawRow[]        (plain scalars)
                                   │
                                   ▼
                        model.ts   → DashboardModel  (projects, milestones,
                                   │                   needs-dates, warnings)
                    ┌──────────────┼──────────────────┐
                    ▼              ▼                  ▼
              select.ts        scale.ts           render.ts
           (focus strip)   (weeks/months,     (DOM: strip, legend,
                            bar geometry)      timeline, sections)
```

For the note summary, `note-summary.ts` reads the current file's frontmatter
through the supported `MetadataCache` API and renders it with the same
schema-aware model code. It re-renders when that file's metadata changes.

## Read-only guarantees

- The plugin never calls any vault or adapter write API. `tests/policy.test.ts`
  scans the sources for forbidden calls (`vault.modify`, `vault.create`,
  `adapter.write`, ...) and fails the build if one appears.
- No `fetch`, `requestUrl`, `XMLHttpRequest`, or `WebSocket`; the same test
  guards this.
- No `setInterval` polling.
- The Bases view renders from `onDataUpdated`, which Obsidian calls whenever
  data or configuration changes.

## Dates

All dates are treated as plain local calendar dates:

- `YYYY-MM-DD` strings are parsed field-by-field; `Date` values use local
  getters.
- Day arithmetic uses a linear day counter; nothing is ever round-tripped
  through `toISOString()` or `Date.parse("YYYY-MM-DD")`, which would shift
  days across time zones.
- `tests/dates.test.ts` runs under `TZ=America/Los_Angeles` by default and
  additionally re-runs parsing under several zones to prove the property.

## Failure behavior matrix

| Situation                             | Behavior                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `start` and `target` both valid       | Bar drawn from `start` to `target`.                                         |
| Only one date (either)                | Listed under **Needs dates** with the missing field named.                  |
| Neither date                          | Listed under **Needs dates**.                                               |
| `target` before `start`               | Warning; bar omitted.                                                       |
| Unreadable date (e.g. `someday`)      | Treated as missing + warning that quotes the value.                         |
| Invalid `progress` (non-numeric)      | Rendered as 0 + warning.                                                    |
| Invalid `progress` (out of range)     | Clamped for rendering only + warning quoting the original value.            |
| Fractional `progress`                 | Rounded for rendering + warning.                                            |
| Unknown enum value                    | Neutral color fallback + warning quoting the invalid value.                 |
| Completed / cancelled items           | Hidden by default; revealed with the "Show completed and cancelled" option. |
| Milestone without a resolvable parent | Warning; the milestone is not attached to a row.                            |
| Milestone without a target            | Warning; no marker is drawn.                                                |
| Empty dataset                         | Calm empty state with guidance.                                             |
| Duplicate milestones on one date      | Markers stack vertically; nothing crashes.                                  |

## Summary strip rules

The focus strip is derived, never configured:

- **Finish first** — the highest-priority open project with
  `attention: finish-first`, ties broken by the earliest valid target
  (projects without a target sort last).
- **Hard deadline** — the nearest open project with `hard_deadline: true` and
  a target today or later.
- **Next milestone** — the nearest open milestone with a target today or
  later.

When several items qualify, the first is shown with a `+N` count. When none
qualify, a calm empty state is shown.

## Scale

- `automatic` uses the weeks scale for spans up to 84 days and switches to
  months beyond that.
- `weeks` and `months` force a scale regardless of span.
- `TODAY_EXPAND_GAP_DAYS` (60) controls whether the visible range stretches to
  include today when the data sits slightly in the future or the past.

## Performance notes

The view renders only the rows in the Base. Keep Bases filters scoped (for
example `type == "project" or type == "milestone"`) and the view stays light
for typical personal project counts. The renderer creates DOM nodes per
render; there is no element reuse yet, which is acceptable for v1's expected
scale and is a natural next increment if a vault ever needs it.
