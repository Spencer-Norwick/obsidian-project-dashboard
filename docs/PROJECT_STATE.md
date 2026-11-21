# Project State

Last updated: 2026-11-20
Repository: obsidian-project-dashboard
Branch: codex/closed-projects-unscheduled-backlog
Last known-good commit: ca84cbf (baseline; 45 focused tests passed before changes)

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

| Check                       | Result  | Evidence                                        |
| --------------------------- | ------- | ----------------------------------------------- |
| Focused baseline            | passed  | 45 tests before implementation                  |
| Regression reproduction     | passed  | New cases failed against the old implementation |
| `npm run check`             | passed  | Formatting, lint, typecheck, build, 138 tests   |
| Live application validation | pending | Verify installed plugin before handoff          |
| Remote integration          | pending | Push and merge after checks pass                |

## Active Problems

- No known automated-check failures. The installed production bundle passed a
  local data/render smoke test using a simulated DOM and Obsidian API boundary.
- A live refresh could not be confirmed because native window control was
  unavailable. Reload the app/plugin to load the installed bundle.
- Remote delivery remains in progress.

## Decisions and Constraints

- Lifecycle and schedule outcome remain separate: missed timing does not imply
  successful completion. Cancellation uses the existing closed lifecycle value.
- The plugin remains read-only. Dates, progress, and checklist completion are
  never inferred or changed by rendering.
- Public regression fixtures are fictional; private vault data is not published.

## Next Action

1. Deliver through a checked PR, then reload the installed plugin in Obsidian.
