# Installation and removal

## Requirements

- Obsidian desktop 1.14.4 or newer (the version this plugin targets).
- Node.js 20+ only if you build the plugin from source.

## Install from a clone (manual)

1. Build the plugin:

   ```sh
   npm ci
   npm run build
   ```

2. Create the plugin folder in your vault and copy the three runtime files:

   ```sh
   mkdir -p "<vault>/.obsidian/plugins/project-dashboard"
   cp main.js manifest.json styles.css "<vault>/.obsidian/plugins/project-dashboard/"
   ```

3. In Obsidian: **Settings → Community plugins → Enable community plugins**,
   then enable **Project Dashboard**.

## Try the fictional demo vault

```sh
npm ci
npm run demo:install   # builds the plugin and installs it into demo-vault/
```

Open the `demo-vault/` folder as a vault in Obsidian and open `Dashboard.md`.
No other setup is required; the vault enables Bases and the plugin through its
own `.obsidian` config. All demo content is fictional.

## First run in your own vault

1. Add properties to a few notes following `docs/schema.md` (or start from the
   templates in `templates/`; copy them into your vault's template folder).
2. Copy `bases/Projects.base` into your vault (or create a new Base yourself)
   and filter it to `type == "project"` and `type == "milestone"`.
3. Open the Base and switch the view layout to **Project timeline**. View
   options:
   - **Scale** — Automatic, Weeks, or Months.
   - **Show completed and cancelled** — off by default.
4. Optional: add a `project-summary` code block at the top of project notes to
   get the property-driven summary card.

Notes stay ordinary Markdown. If the plugin is disabled, the same Base still
renders its **Table** view and the notes read as plain notes.

## Removal

1. Disable **Project Dashboard** in **Settings → Community plugins**.
2. Delete the plugin folder:

   ```sh
   rm -rf "<vault>/.obsidian/plugins/project-dashboard"
   ```

3. Optionally delete `Projects.base`, the templates, and the
   `project-summary` code blocks. The plugin never modified your notes, so
   nothing else needs cleanup.

## Updating

Rebuild (`npm ci && npm run build`) and overwrite the three runtime files in
the plugin folder. There are no migrations and no stored state.
