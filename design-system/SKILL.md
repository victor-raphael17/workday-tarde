---
name: ca-pharmacy-design
description: Use this skill to generate well-branded interfaces and assets for CA Pharmacy (pharmacy software to sell and control stock of medications), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out
and create static HTML files for the user to view. If working on production code, you can
copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build
or design, ask some questions, and act as an expert designer who outputs HTML artifacts
_or_ production code, depending on the need.

## Quick map
- `README.md` — brand context, content fundamentals, visual foundations, iconography, index.
- `colors_and_type.css` — all design tokens. Import first.
- `assets/` — logo mark/lockup, cross motif.
- `preview/` — spec cards (color, type, spacing, components).
- `ui_kits/console/` — interactive Pharmacy Console (Dashboard, POS, Inventory,
  Prescriptions); reuse its JSX components and `styles.css`.

## Non-negotiables
- Pharmacy green (`--green-600`) is the only large-area brand color; everything else is
  slate neutral + status tints.
- All data (SKU, NDC, batch, quantity, price, dates) is **JetBrains Mono, tabular figures**.
- Use the canonical stock states and their colors; controlled substances always get the
  violet treatment + shield/lock icon.
- Lucide icons, sentence case, verbs on buttons, exact numbers with units. No emoji,
  no gradients.
