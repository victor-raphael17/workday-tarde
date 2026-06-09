# CA Pharmacy Console — UI kit

Interactive, high-fidelity recreation of the **Pharmacy Console** web app. Desktop-first
(dark sidebar + light workspace). This is a *cosmetic* recreation for prototyping — the
data is fake (`data.jsx`) and there is no backend.

> **Source note:** built from the product brief, not an existing codebase/Figma. If you
> have the real source, attach it and ask for a reconciliation pass.

## Run it
Open `index.html`. It loads React 18 + Babel (inline JSX) + Lucide (CDN) and pulls tokens
from `../../colors_and_type.css`.

## Interactive flows
- **Sidebar** switches between the four core screens (plus placeholder surfaces).
- **Dashboard** — KPIs, weekly-sales bars, "attention needed" + dispensing queue; buttons
  jump to other screens.
- **Point of sale** — tap/scan products to add to the cart, adjust quantities with the
  stepper, see a controlled-substance banner, take payment → toast + cart clears.
- **Inventory** — filter tabs (All / Low-out / Expiring / Controlled), live search, click
  any row to open the **detail drawer** (stock, active batch, supplier) and reorder.
- **Prescriptions** — kanban queue (New → Verifying → Ready → Dispensed); click a card or
  its action button to advance its state.
- **Patients** — searchable directory; click a row for the detail drawer (allergies/alerts,
  profile, current medications) and start a prescription.
- **Orders** — reorder-suggestions banner + purchase-order table (Draft / Submitted /
  In transit / Received); click a PO to open its line items and submit/receive it.

## Files
| File | Role |
|---|---|
| `index.html` | Entry point; loads libs + all scripts in order. |
| `styles.css` | All kit styles (shell, buttons, badges, tables, drawer, POS, kanban). Imports the token file. |
| `data.jsx` | Fake medications, prescriptions, weekly-sales data → `window.CADATA`. |
| `components.jsx` | Primitives: `Icon`, `Button`, `StatusBadge`, `Card`, `PageHeader`, `Avatar`, `Toast`, `money()`. |
| `Shell.jsx` | `Sidebar` + `Topbar`. |
| `Dashboard.jsx` `Inventory.jsx` `PointOfSale.jsx` `Prescriptions.jsx` `Patients.jsx` `Orders.jsx` | The six screens. |
| `app.jsx` | `App` root: screen state, toast, placeholder screens. |

## Conventions to keep
- **Icons:** `<Icon name="..." />` (Lucide). The component renders the glyph imperatively
  into a span so React never reconciles the swapped `<svg>` — keep this pattern; do **not**
  call `lucide.createIcons()` globally inside React (it crashes reconciliation).
- **Data type** (SKU, qty, price, dates) → `.mono` / JetBrains Mono, tabular figures.
- **Status** → `<StatusBadge status="in|low|out|expiring|expired|recalled|ordered|controlled" />`.
- **Controlled substances** always carry the violet treatment + `shield-alert`/`lock` icon.
- Sentence case, verbs on buttons, exact numbers with units (see root README → Content
  Fundamentals).
