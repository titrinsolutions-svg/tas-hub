# `src/data/` — Shared data files

This folder holds JSON data that both the **tas-hub web app** AND **external tools** (Python scripts in `TITRIN/Claude/TAS - Tools/`) can read/write.

## `projects.json`

The canonical project list. Schema matches the `Project` TypeScript interface in [`../types.ts`](../types.ts):

```ts
interface Project {
  name: string;              // e.g. "8646 Mandeville Ave, Burnaby — TAS 26.0001"
  client: string;            // freeform client/contact line
  badge: 'fp' | 'alc' | 'fqa' | 'cemp' | 'sfu' | 'new';
  badgeLabel: string;        // human-readable badge name
  status: 'active' | 'urgent' | 'hold' | 'new';
  note: string;              // current state / context
  action: string;            // next action
  actionType: 'normal' | 'urgent';
}
```

**Consumed by:** [`../constants.ts`](../constants.ts) imports this file directly. Vite handles JSON imports via `resolveJsonModule` in [`../../tsconfig.json`](../../tsconfig.json).

## How to use from Python

Read:

```python
import json
from pathlib import Path

PROJECTS_PATH = Path(r"C:\Users\Tish\Downloads\tas-hub\src\data\projects.json")

with PROJECTS_PATH.open(encoding="utf-8") as f:
    projects = json.load(f)

# projects is a list of dicts matching the Project interface above
for p in projects:
    print(p["name"], "→", p["status"])
```

Write (append a new project):

```python
projects.append({
    "name": "NEW ADDRESS — TAS 26.0099",
    "client": "Client Name (email@example.com)",
    "badge": "fp",
    "badgeLabel": "Farm Plan",
    "status": "new",
    "note": "Initial inquiry on YYYY-MM-DD. Awaiting client agreement.",
    "action": "Send fee proposal + client agreement.",
    "actionType": "normal"
})

with PROJECTS_PATH.open("w", encoding="utf-8") as f:
    json.dump(projects, f, indent=2, ensure_ascii=False)
```

## Coordination

The tas-hub web app reads this JSON at build time AND merges per-user edits from localStorage (`UserEdits.customProjects`, `UserEdits.deletedProjects`, `UserEdits.projectOverrides`). So:

- **Python writes** go into the canonical JSON → visible to everyone after next page load
- **Web edits** are kept in localStorage / Firebase sync — they override the JSON locally but don't write back to it

If Python writes a project that's also been deleted via the web's UserEdits, the web user will still see it as deleted on their device. Use Python additions for new projects; treat UserEdits as the human's local overlay.

When in doubt, commit the JSON file after Python writes — that puts it in git history and makes the canonical state explicit.
