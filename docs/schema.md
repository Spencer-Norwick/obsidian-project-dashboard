# Canonical schema

The Project Dashboard plugin reads a small, stable set of frontmatter properties.
Property names use `snake_case` so they stay portable across templates, Bases
filters, and ordinary Markdown.

## Project notes

```yaml
type: project
domain:
focus:
goals: []
capabilities: []
interests: []
status: defining
attention: normal
schedule_state: proposed
priority: medium
start:
target:
hard_deadline: false
progress: 0
phase:
outcome:
done_when: []
next_action:
next_review:
```

| Property         | Notes                                                              |
| ---------------- | ------------------------------------------------------------------ |
| `type`           | Must be `project`.                                                 |
| `domain`         | Note link to the durable area of life this project belongs to.     |
| `focus`          | Note link to the long-running direction within a domain.           |
| `goals`          | List of note links to time-bound desired outcomes.                 |
| `capabilities`   | List of note links to capability targets being developed.          |
| `interests`      | List of cross-cutting interest tags (not a hierarchy level).       |
| `status`         | Lifecycle state; see allowed values below.                         |
| `attention`      | `finish-first` marks a project as closing priority.                |
| `schedule_state` | `proposed` timing is visibly distinct from `committed` timing.     |
| `priority`       | Used to rank summary highlights and list order.                    |
| `start`          | Local calendar date (`YYYY-MM-DD`).                                |
| `target`         | Local calendar date (`YYYY-MM-DD`).                                |
| `hard_deadline`  | `true` when the target is externally fixed.                        |
| `progress`       | Integer from `0` through `100`, supplied manually. Never inferred. |
| `phase`          | Optional short label for the current phase.                        |
| `outcome`        | One-sentence description of the produced outcome.                  |
| `done_when`      | List of plain-text completion checks.                              |
| `next_action`    | The next physical action.                                          |
| `next_review`    | Local calendar date for the next review.                           |

## Milestone notes

```yaml
type: milestone
parent_project:
target:
status: scheduled
hard_deadline: false
```

| Property         | Notes                                               |
| ---------------- | --------------------------------------------------- |
| `type`           | Must be `milestone`.                                |
| `parent_project` | Note link to the project this milestone belongs to. |
| `target`         | Local calendar date the milestone is expected on.   |
| `status`         | Same lifecycle values as projects.                  |
| `hard_deadline`  | `true` when the milestone date is externally fixed. |

## Allowed values

- `status`: `defining`, `scheduled`, `active`, `waiting`, `paused`, `complete`, `cancelled`
- `attention`: `finish-first`, `normal`
- `schedule_state`: `proposed`, `committed`
- `priority`: `high`, `medium`, `low`
- `progress`: integer from `0` through `100`

The dashboard hides `complete` and `cancelled` items by default and offers a
view option to reveal them.

## Relationships

- Projects link upward through `domain` and `focus` note links.
- Milestones link upward through `parent_project`.
- Deliverables and tasks also use `parent_project` to link upward.
- `interests` is a cross-cutting tag list, not a hierarchy level.

## Remaining entity types

The full information model is:

```text
Domain
- Focus
  - Goal
  - Capability target
  - Practice
  - Project
    - Deliverable
    - Milestone
    - Task
Interest (cross-cutting)
```

V1 visualizes projects and milestones only. The remaining entity types are
documented and have restrained templates in `templates/`, but the plugin does
not build management interfaces for them.

## Failure behavior

The plugin never invents missing dates. See `docs/architecture.md` for the full
matrix of non-fatal fallbacks used when data is missing or malformed.
