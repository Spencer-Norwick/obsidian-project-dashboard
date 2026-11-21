# Project State

Last updated: 2026-11-20
Repository: obsidian-project-dashboard
Branch: codex/closed-projects-unscheduled-backlog
Last known-good commit: 5403310 (source/build checks and 138 tests passed)

## Current Objective

Recognize missed scheduling outcomes and keep intentionally undated parked
proposals visible without inventing a timeline schedule.

## Verified State

- `schedule_state: missed` is recognized; use the existing `status: cancelled`
  lifecycle for abandoned outcomes. Records and manual progress are preserved.
- Proposed defining/waiting/paused projects with both dates blank appear under
  Unscheduled. Partial, invalid, active, scheduled, or committed schedules still
  need dates; invalid values continue to generate warnings.
- Closed projects and their milestones remain hidden by default and can be
  revealed with the existing view option.

## Recent Progress

- Added regression coverage for missed cancellations, unscheduled proposals,
  incomplete or invalid schedules, empty states, and note navigation.
- Rebuilt the committed production bundle from the TypeScript source.

## Validation

| Check                            | Result  | Evidence                                                                                                                        |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Focused baseline                 | passed  | 45 tests before implementation                                                                                                  |
| Regression reproduction          | passed  | New cases failed against the old implementation                                                                                 |
| `npm run check`                  | passed  | Formatting, lint, typecheck, build, 138 tests                                                                                   |
| Installed-bundle data smoke test | passed  | Old build reproduces the issues; installed build renders local data without warnings, preserving closed history and blank dates |
| Live application refresh         | blocked | Native window control returned noWindowsAvailable; app/plugin reload remains unverified                                         |

## Active Problems

- No known automated-check failures. The installed production bundle passed a
  local data/render smoke test using a simulated DOM and Obsidian API boundary.
- A live refresh could not be confirmed because native window control was
  unavailable. Reload the app/plugin to load the installed bundle.
- Delivery evidence and cloud validation are recorded in
  [PR #2](https://github.com/Spencer-Norwick/obsidian-project-dashboard/pull/2).

## Decisions and Constraints

- Lifecycle and schedule outcome remain separate: missed timing does not imply
  successful completion. Cancellation uses the existing closed lifecycle value.
- The plugin remains read-only. Dates, progress, and checklist completion are
  never inferred or changed by rendering.
- Public regression fixtures are fictional; private vault data is not published.

## Next Action

1. Reload the installed plugin or restart Obsidian to activate the updated build.
