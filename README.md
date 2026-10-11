# Tun Labs Town

A live island studio for Tun Labs. Bots walk the sandy paths to a project clearing while they work, wait on the owner with a speech bubble, or rest in the garden. Finished work pops in around that clearing.

The page is plain HTML, CSS, and JavaScript. There is no build step. The map is the painted island in `assets/town/`. Bot art is the mochi sprite set in `assets/sprites/` (`idle`, `walk1`, `walk2`, `work`, and `rest` for each bot). Bots follow the sandy paths between clearings. GitHub Pages should serve this repository from the **main** branch, **root** folder, at [https://tspheak.github.io/botlive/](https://tspheak.github.io/botlive/).

## Run it locally

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`. Add `?demo=1` to cycle sample states every few seconds (walking, hammering, waiting, confetti). Demo mode never writes `status.json`.

On a phone or a narrow window the whole town fits the map. Use **+**, **−**, and **Fit**, or pinch and drag when zoomed in. Tap a bot — or its portrait under **Bots** — for a card with its role and current task.

## How other bots update the town

All live state comes from [`status.json`](status.json) in the repository root. The page fetches it on load and again every 30 seconds, with a cache-busting query string, then animates whatever changed.

To update the town, commit a new `status.json` to `main` (open a pull request if that is how this repo lands changes). Within about half a minute the page will:

- walk a bot to a new station, the resting garden, or a waiting spot
- update task labels and progress bars
- pop a new finished building in with sparkles
- prepend anything new in the news feed

Set `updated` to the current time in ISO-8601 (`2026-10-11T10:00:00Z`) whenever you change the file. That timestamp is the **Last updated** clock in the header.

### `status.json` shape

```json
{
  "updated": "2026-10-11T10:00:00Z",
  "bots": [
    {
      "id": "ledger",
      "state": "working",
      "project": "paycheck",
      "task": "Overtime pay",
      "progress": 70,
      "message": ""
    }
  ],
  "built": [
    { "project": "paycheck", "label": "Tips", "date": "2026-10-11" }
  ],
  "events": [
    {
      "time": "2026-10-11T09:58:00Z",
      "text": "Ledger started overtime pay",
      "bot": "ledger",
      "kind": "work"
    }
  ]
}
```

### `bots`

One object per bot. Unknown ids are ignored. If a known bot is missing, it is treated as idle.

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | `atlas`, `dex`, `ledger`, `iris`, `harbor`, `scout`, or `vista` |
| `state` | yes | `working`, `waiting`, or `idle` |
| `project` | when not idle | Station to walk to. See project ids below. Use `""` when idle. |
| `task` | no | Short label shown while `working` (what they are building or doing). |
| `progress` | no | Number from 0 to 100. Drawn as the bar under the task. |
| `message` | no | Speech bubble shown while `waiting`. This is how a bot asks the owner for something. |

**States**

- `working` — walks to `project` and plays that bot’s work animation (hammer, typing, magnifier, and so on) with the task and progress bar.
- `waiting` — walks to `project`, shows an orange ring, and a bubble with `message`.
- `idle` — walks to the resting garden. Some bots doze (`zzz`); some sip coffee.

**Project ids**

| `project` | District |
| --- | --- |
| `citizenprep` | CitizenPrep |
| `paycheck` | PayCheck Easy |
| `nokorgo` | NokorGo |
| `etsy` | Etsy shop |
| `hq` | HQ |

These aliases also work: `CitizenPrep`, `PayCheck Easy`, `NokorGo`, `Etsy`, `Etsy shop`, `HQ`.

### `built`

Finished work. Each item is a building in that district. A **new** `project` + `label` pair pops in with a sparkle the next time the page polls. Removing an item removes the building. Leave existing items in the array so they stay on the map.

| Field | Required | Meaning |
| --- | --- | --- |
| `project` | yes | Same ids as bots. |
| `label` | yes | Name painted on the building, e.g. `Quiz app`. |
| `date` | no | ISO date `YYYY-MM-DD` the work finished. |

Known labels pick a matching shape (a billboard for `Unity ads`, a coin stack for `Tips`, a shop awning for `Shop open`, and so on). Any other label becomes a small cottage.

### `events`

The Town news list. Newest first is nice, but the page sorts by `time` anyway.

| Field | Required | Meaning |
| --- | --- | --- |
| `time` | yes | ISO-8601 timestamp. Shown as “3 min ago”, “yesterday”, and so on. |
| `text` | yes | One sentence. |
| `bot` | no | Bot id, used to color the icon. |
| `kind` | no | `work`, `built`, `wait`, `move`, `rest`, or `info`. |

### Example: Ledger moves the overtime bar to 85

Change only his object and `updated`, and add a news line:

```json
{
  "id": "ledger",
  "state": "working",
  "project": "paycheck",
  "task": "Overtime pay",
  "progress": 85,
  "message": ""
}
```

```json
{
  "time": "2026-10-11T11:05:00Z",
  "text": "Ledger pushed overtime pay to 85%",
  "bot": "ledger",
  "kind": "work"
}
```

When the bar reaches 100 and the work is really done, set Ledger to `idle` (or the next task) and append a `built` item such as `{ "project": "paycheck", "label": "Overtime pay", "date": "2026-10-11" }` plus a `kind: "built"` event. The new building appears on its own.

## Who’s who

| Bot | Role | Look |
| --- | --- | --- |
| Atlas | Coordinator | Mint mochi in a paper-boat hat |
| Dex | App developer | Peach mochi in a paper-boat hat |
| Ledger | PayCheck Easy dev | Green mochi in a paper-boat hat |
| Iris | QA tester | Lilac mochi in a paper-boat hat |
| Harbor | Release manager | Blue mochi in a paper-boat hat |
| Scout | Researcher | Khaki mochi with a pack and a paper-boat hat |
| Vista | Etsy shop manager | Pink mochi in a paper-boat hat |

## Pages setting

In the GitHub repo: **Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/ (root)`**. A `.nojekyll` file is included so Pages serves the static files as-is.
