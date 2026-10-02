# LUMA — on-screen film prop

A **frontend-only, fictional** web app built as an on-screen prop. It has no backend, real login, payments, messaging, tracking or analytics. All content is local mock data, and every filmed interaction is scripted so it plays the same way on every take.

It is a standalone app inside this repo and does not touch the RTG Media site.

## Run

```bash
cd luma
npm install
npm run dev        # http://localhost:5174
```

Offline / set laptop build (fonts are bundled, no network needed):

```bash
npm run build      # outputs luma/dist
npm run preview    # http://localhost:4173
```

`dist/` uses relative paths and hash routing, so you can serve it from any static folder.

## Routes

| Route | Screen |
|---|---|
| `#/` | Public LUMA corporate site (the subtle **OPERATOR ACCESS** link is in the footer, next to a tiny bunny) |
| `#/welcome` | "WELCOME TO LUMA" onboarding video (mock player with timed captions) |
| `#/access` | Operator login: any input works |
| `#/portal` | CROSS dashboard |
| `#/portal/contracts` · `/contracts/:id` | Available contracts · contract detail |
| `#/portal/active` | Active contract (REPORT ISSUE / COMPLETE CONTRACT) |
| `#/portal/complete` | Mission complete → payment sent |
| `#/portal/network` · `/leaderboard` · `/operators/:id` | Network, Operator Rankings, operator profile |
| `#/portal/messages` · `/payments` | Inbox, ledger |
| `#/naomi` | Starts the Naomi discovery route from a clean state |

## Director Mode

You can open it three ways:

- the small **gear** in the bottom-right corner. In Performance Mode it is almost invisible on camera, but the crew can still click it.
- the **Shift + D** keyboard shortcut (it does nothing while someone is typing in a field).
- the **`?director`** URL parameter, e.g. `http://localhost:4173/?director#/portal`.

From the panel you can:

- reset the scene or reset everything
- toggle Performance Mode
- jump to any of 14 preset screens
- pick the scripted contract and set the payout
- trigger a new contract, a message or a payment
- move CROSS up or down the rankings and set any operator's status
- restart animations or perk the bunny's ears

More URL controls: `?scene=<presetId>` (e.g. `?scene=active`, `?scene=report`, `?scene=complete`, `?scene=naomi-profile`) and `?reset`.

## Resetting a take

- **Shift + R**, or **↺ RESET SCENE** in the panel, resets the state and replays the current screen's preset from the beginning: same text, same timing, same countdown.
- **RESET ALL**, or loading `?reset`, returns to a clean state on the public homepage.
- The scene state survives a page reload via `localStorage`. Only these resets clear it.

## Performance Mode (on by default)

- Off-script taps do nothing. In REPORT ISSUE, only **UNEXPECTED VISITOR → MEDIA** responds. Only the scripted contract can be accepted. PASS just goes back to the list.
- Tapping outside a modal or pressing Escape won't close it.
- Double-tapping ENTER on the login screen is ignored.
- Turn it off in Director Mode to explore freely. Other issue paths then get a generic "NOTED. / STAND BY." reply.

## Filming sequences

**Adrian:** Login → Dashboard → open MARCUS VALE → ACCEPT CONTRACT (green flash, "CONTRACT ACTIVE" stamp) → OPEN ACTIVE CONTRACT → REPORT ISSUE → UNEXPECTED VISITOR → MEDIA → SUBMIT → three dots → **GOT IT.** → **USE YOUR JUDGMENT.** → RETURN TO CONTRACT → COMPLETE CONTRACT → CONFIRM → **MISSION COMPLETE** → three dots → **ACKNOWLEDGED** → **PAYMENT SENT** → **$300,000** (with the celebrating bunny).

**Naomi:** `#/naomi` → public homepage → footer **OPERATOR ACCESS** → any credential (placeholder hint `OBSERVER-7741`) → **Network** → **RANKINGS** → **CROSS** → badges **VERIFIED OPERATOR** and **MILITARY BACKGROUND: VERIFIED**, plus **ARCHIVED CONTRACTS** (the Portland record is highlighted). Adrian's legal name never appears anywhere in the app.

## Editing story content (no UI code changes needed)

All of it lives in `src/data/`:

| File | Contents |
|---|---|
| `operator.ts` | CROSS stat block, greeting |
| `contracts.ts` | contracts, the scripted contract id, the Director's "new contract" |
| `operators.ts` | network and leaderboard roster |
| `feed.ts` | operator activity feed |
| `messages.ts` | inbox, payments ledger, **scripted sequences and their timings**, Report Issue options |
| `publicSite.ts` | corporate site and onboarding video copy |
| `naomi.ts` | discovery badges, archived contract clues |
| `scenes.ts` | Director presets, default payout and standing, login delay, active window clock |

**Real photos:** put black-and-white cutouts in `public/photos/` and set `photo: "photos/vale.png"` on a contract. Without one, a generated halftone silhouette is shown.
