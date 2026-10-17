# In-app verification

`verify.mjs` drives a real Obsidian instance against the fictional demo vault
and prints a pass/fail report. It exists because the most valuable bugs
(Bases load order, `NullValue` strings) only appear inside the app.

How it protects your setup:

- It launches Obsidian with `--user-data-dir=<temp>` and a generated
  `obsidian.json`, so your real profile, vault list, and settings are never
  read or modified.
- It only opens `demo-vault/` from this repository.
- The vault-write audit intentionally edits two lines of a fictional demo
  note and restores the original content.

Usage (macOS; Obsidian 1.14.x installed):

```sh
npm run build
node tests/in-app/verify.mjs                 # defaults
OBSIDIAN_BIN="/path/to/Obsidian" CDP_PORT=9333 node tests/in-app/verify.mjs
```

The script exits non-zero if any check fails and quits the instance at the
end.
