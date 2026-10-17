# Project Dashboard demo vault (fictional)

Every note in this vault is fictional. It exists to try the Project Dashboard
plugin against realistic-looking content without touching a real vault.

## How to try it

1. From the repository root, build the plugin and install it into this vault:
   `npm ci && npm run demo:install`
2. Open this folder as a vault in Obsidian (desktop 1.14.4 or newer).
3. Open **Dashboard.md** — it embeds the Timeline view of `Projects.base`.

## What to look at

- `Dashboard.md` — the derived focus strip, the timeline, and the table view.
- `Boathouse/Projects/` — ten projects across every status, scheduled and
  proposed, with one finish-first pair (`Refit the training singles` and
  `Autumn regatta logistics`).
- Four notes in this vault are intentionally malformed so you can see the
  plugin's non-fatal failure states:
  - `Projects/Recatalog the map cabinet` — no dates at all (Needs dates).
  - `Projects/Paint the west stair` — target before start (warning).
  - `Projects/Solar bench retrofit` — unknown status `in-review` and progress
    `140` (neutral fallback + clamped rendering, both flagged).
  - `Milestones/Book the speaker` — links to a parent project that does not
    exist (warning).

The plugin never edits these notes. Fixing a broken value and watching the
dashboard recover is the intended demo.
