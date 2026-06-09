# CA Pharmacy — Design System

> Pharmacy software to **sell** and **control stock** of medications. CA Pharmacy is the
> operating system for an independent or chain pharmacy: a point-of-sale for dispensing
> and selling, plus a stock-control backbone that tracks every batch, expiry, and
> controlled substance from goods-in to the counter.

This repository is the single source of truth for the CA Pharmacy brand and product UI.
It contains brand assets, low-level visual foundations (color, type, spacing, elevation,
motion), and high-level UI kits that recreate the real product surfaces.

---

## ⚠️ Provenance & sources

This design system was **created from a written product brief**, not imported from an
existing codebase or Figma file. There was:

- **No codebase** attached or referenced.
- **No Figma** file or link provided.
- **No slide deck / brand kit** provided.

Everything here is an **original, internally-consistent design direction** built to fit the
product description ("pharmacy software to sell and control stocks of medications"). If you
have the real product's source, Figma, or brand guide, **attach it via the Import menu and
ask for a reconciliation pass** — this system should then be aligned to the real artifacts.

**Font note:** the brand uses **Hanken Grotesk** (UI) and **JetBrains Mono** (data), both
loaded from Google Fonts via `@import` in `colors_and_type.css`. They are *not* bundled as
local files in `fonts/`. If you need offline/self-contained output, ask and I'll vendor the
`woff2` files locally.

---

## What CA Pharmacy is

The product is a desktop-first web application — the **Pharmacy Console** — used by
pharmacists and pharmacy technicians behind the counter and in the dispensary. Core jobs:

| Surface | Job to be done |
|---|---|
| **Dashboard** | At-a-glance health: today's sales, dispensing queue, low-stock & expiry alerts. |
| **Point of Sale** | Scan, dispense, sell OTC + prescription items, take payment. |
| **Inventory / Stock** | Track quantity-on-hand, batches, expiry dates, reorder points, suppliers. |
| **Prescriptions** | Intake, verify, fill, and label prescriptions; flag interactions. |
| **Controlled register** | Audit-grade log for controlled / scheduled substances. |

The tone is **clinical and precise but calm** — software that a regulated, busy, detail-
critical workplace can trust. It favors legibility, tabular data, and unambiguous status
over decoration.

---

## CONTENT FUNDAMENTALS

How CA Pharmacy writes. Copy is **clear, clinical, and economical** — never cute, never
alarmist. The user is a trained professional under time pressure; respect that.

- **Voice:** calm, exact, quietly reassuring. Like a good colleague reading off a label.
- **Person:** address the user as **"you"**; the system refers to itself implicitly
  ("Stock updated", not "We updated your stock"). Avoid "I".
- **Casing:** **Sentence case** everywhere — buttons, menus, titles, table headers.
  (e.g. "Add to order", "Low stock", "Expiring soon".) Reserve Title Case only for proper
  product names. ALL-CAPS is used *only* for tiny eyebrows/overlines with letter-spacing.
- **Numbers & units:** always explicit and monospaced. Quantities show units
  ("24 packs", "500 mg"); money shows currency ("$12.40"); dates are unambiguous
  ("12 Aug 2026", never "8/12"). Use tabular figures in every table.
- **Status language:** short, consistent, status-coded. The canonical stock states are
  **In stock · Low stock · Out of stock · Expiring soon · Expired · Recalled · On order**.
  Use these exact phrases.
- **Verbs first on actions:** "Dispense", "Receive stock", "Reorder", "Void sale",
  "Verify prescription". Buttons are verbs, not nouns.
- **Errors & warnings:** factual + actionable, never blaming. "2 items are below reorder
  point" → with a clear next step ("Review reorder list"). Safety-critical flags
  (interactions, controlled substances, recalls) are stated plainly and never softened.
- **Empty states:** instructive, not jokey. "No prescriptions in the queue. Scan or search
  to start one."
- **No emoji. No exclamation marks** (except genuine celebratory confirmations, sparingly).
  No marketing fluff inside the product.

**Examples**
- Button: `Receive stock` · `Add to sale` · `Print label`
- Toast: `Sale completed — $42.80 · Receipt #10293`
- Alert: `Amoxicillin 500mg — 3 packs left (reorder point 10)`
- Confirm: `Void this sale? This cannot be undone.`

---

## VISUAL FOUNDATIONS

The aesthetic is **"apothecary precision"**: clean white surfaces, a confident medicinal
green, cool slate neutrals, and crisp tabular data. It should feel like well-organized
pharmaceutical packaging — orderly, labeled, trustworthy.

### Color
- **Primary brand = pharmacy green** (`--green-600 #0e8163`). Used for primary actions,
  active nav, links, brand. A full 50→900 scale is defined in `colors_and_type.css`.
- **Neutrals = cool slate** (`--slate-*`). Backgrounds are near-white
  (`--canvas #fbfcfd`), surfaces are pure white, ink is slate-800/900.
- **Status palette** is the workhorse — every stock/prescription state maps to a
  semantic color with a matched `*-bg` (tint) and `*-bd` (border):
  - success/in-stock = green · warning/low-stock = amber (`#b6730a`)
  - danger/out·expired·recall = red (`#c5403c`) · info/system·rx = blue (`#2563c9`)
  - **controlled substances = violet** (`#6b3fb0`) — a dedicated hue so scheduled drugs
    are instantly recognizable.
- Color is **functional, not decorative**. Green is the only "brand color" used at large
  area; everything else is neutral + status tints.

### Type
- **Hanken Grotesk** for all UI text — a humanist grotesk that's friendly but precise.
- **JetBrains Mono** for *all data*: SKUs, NDC codes, batch/lot numbers, quantities,
  prices, dates in tables. Monospace + `tabular-nums` keeps columns aligned and signals
  "this is exact data". This sans/mono split is the signature of the system.
- Scale is a 1.20 minor third (11→44px). Base UI text is **14px**. Headings use tight
  tracking; eyebrows are 11px uppercase with `0.06em` tracking.

### Spacing & layout
- **4px base grid.** Tokens `--space-1`…`--space-16`.
- Desktop-first. The console is a **fixed left sidebar (240px) + top bar + scrolling
  content** shell. Content max-width ~1280px for forms; tables go full width.
- Dense but breathable: table rows ~44px, comfortable 16–24px card padding. Hit targets
  ≥ 36px (≥44px for primary touch/counter actions).

### Surfaces, borders, corners, elevation
- **Cards:** white surface, **1px `--border` (#dde3ea)** hairline, `--radius-lg (10px)`,
  and a *very* soft shadow (`--shadow-sm`) — mostly the border does the work. Inputs/
  buttons use `--radius-md (8px)`. Pills/badges use `--radius-pill`.
- **Elevation** is restrained: 4 steps (`xs/sm/md/lg`). Shadows are low-spread, cool, and
  subtle — this is a "flat with hairlines" system, **not** a heavy-drop-shadow system.
  Modals/popovers use `--shadow-lg`; resting cards rarely exceed `--shadow-sm`.
- **No gradients.** Backgrounds are flat. The only texture is the optional faint
  `pattern-crosses.svg` tile used in empty states / hero panels at ~5% opacity.

### Motion
- Quick and unobtrusive. `--dur-fast 120ms` for hover/press, `--dur-base 180ms` for
  panels, `--dur-slow 280ms` for modal/drawer entrances. Easing `--ease-standard`
  (`cubic-bezier(.2,0,0,1)`). **No bounces, no parallax.** Fades + small (4–8px) slides
  only. Respect `prefers-reduced-motion`.

### Interaction states
- **Hover:** primary buttons darken to `--green-700`; ghost/neutral items get a
  `--slate-50/100` fill. Rows highlight with `--slate-50`.
- **Press/active:** a touch darker + `transform: translateY(1px)` (no shrink-scale).
- **Focus:** always visible — `--shadow-focus` (3px green ring at 45% alpha). Never remove
  outlines; this is regulated software.
- **Selected/active nav:** brand-soft fill (`--green-50`) + green text + a 3px green
  left indicator bar.
- **Disabled:** `--fg-disabled` text, no shadow, `not-allowed` cursor.

### Imagery
- The product is data, not photography. There is **no stock photography** inside the
  console. Brand imagery is limited to the logo mark, the cross motif, and product
  screenshots. If marketing imagery is ever needed it should be clean, cool-toned, and
  literal (real pharmacy shelves / packaging), never abstract gradient art.

---

## ICONOGRAPHY

- **Icon set: [Lucide](https://lucide.dev)** — the chosen system. Reasons: open-source,
  consistent **1.75px stroke**, rounded joins, geometric and calm — a perfect match for
  the clinical-but-friendly tone. Load from CDN:
  `<script src="https://unpkg.com/lucide@latest"></script>` then `lucide.createIcons()`,
  or per-icon SVG from `https://unpkg.com/lucide-static`.
  **This is a substitution** (no real product icon set was provided) — flag it for review.
- **Sizing:** 16px (inline / dense tables), 18–20px (buttons, nav), 24px (headers/empty
  states). Stroke is never thickened; scale the whole glyph.
- **Color:** icons inherit text color (`currentColor`). Default `--slate-500`; active/brand
  contexts use green; status icons use the matched status color.
- **Common glyphs in product:** `pill`, `package`, `package-search`, `clipboard-list`,
  `scan-line`, `shopping-cart`, `receipt`, `alert-triangle` (low stock),
  `calendar-clock` (expiry), `shield-alert` / `lock` (controlled), `truck` (orders),
  `users` (patients), `bar-chart-3`, `search`, `plus`, `check`, `x`.
- **No emoji.** No multicolor icons. No filled icon styles mixed with stroke — stay
  stroke-only for UI; the only filled mark is the logo.
- Unicode is used sparingly for true symbols only (e.g. `×` for multiply in
  "2 × 500 mg"), never as decorative iconography.

---

## INDEX — what's in this repo

**Foundations**
- `colors_and_type.css` — all design tokens: color scales, semantic aliases, type families,
  type scale, semantic type classes (`.t-h1`, `.t-body`, `.t-mono`…), spacing, radius,
  shadow, motion. **Import this first** in any artifact.
- `README.md` — this file.
- `SKILL.md` — Agent-Skills-compatible entry point.

**Brand assets** (`assets/`)
- `logo-mark.svg` — green tile + white cross (primary app mark).
- `logo-mark-light.svg` — white tile + green cross (for dark/colored backgrounds).
- `logo-full.svg` — mark + "CA Pharmacy" wordmark lockup.
- `pattern-crosses.svg` — tileable faint cross motif for empty states / hero panels.

**Design System cards** (`preview/`)
- Small spec cards rendered in the Design System tab: color palettes, type specimens,
  spacing/radius/shadow tokens, and component states (buttons, inputs, badges, stock
  rows, cards).

**UI Kits** (`ui_kits/`)
- `console/` — the **Pharmacy Console** web app. `index.html` is an interactive click-thru
  (Dashboard → Inventory → Point of Sale → Prescriptions); JSX components are modular and
  reusable. See `ui_kits/console/README.md`.

---

## How to use this system

1. Always `@import "colors_and_type.css"` (or copy its tokens) — never hard-code hex.
2. Use semantic aliases (`--fg`, `--surface`, `--brand`, status vars), not raw scale steps,
   in product code.
3. Put **all data in JetBrains Mono with tabular figures**; everything else in Hanken Grotesk.
4. Pull components from `ui_kits/console/` rather than rebuilding shells.
5. Use Lucide for icons; match the documented glyph vocabulary.
6. Write copy per **Content Fundamentals**: sentence case, "you", verbs on buttons, exact
   numbers with units, the canonical stock-state phrases.
