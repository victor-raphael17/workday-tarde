# CA Pharmacy — Project Context

> **Purpose of this file:** persistent working context so an assistant can be productive
> without re-reading the whole repo each session.
>
> ⚠️ **MUST be updated after every change to the code** — it must always reflect the current
> state of the repo. When you change an endpoint, route, business rule, JS module, page, build
> setup, design token, DB table, run command, service, port, or env var, update the matching
> section here and bump the date below. Treat the update as part of the change, not a follow-up.
>
> Last updated: 2026-06-08 (added BUSINESS_RULES.md documenting extracted business rules).
>
> 🧭 New to the project? Start with **[PLAYBOOK.md](./PLAYBOOK.md)** — a hands-on onboarding
> guide (client view + the path a click takes through the code) so a new dev can pick up
> front and back tasks. This file (PROJECT_CONTEXT) is the reference; the playbook is the tour.
>
> 📋 Business rules live in **[BUSINESS_RULES.md](./BUSINESS_RULES.md)** — implemented rules
> (auth, stock-status derivation, prescription/PO/sale state machines, oversell guards) plus
> recommended-but-not-yet-built rules for a pharmacy. Update it whenever a business rule changes.

## What this is

CA Pharmacy is pharmacy software to **sell** medications and **control stock**. Three parts,
all dockerized:

- **frontend/** — Multi-page app: HTML + Bootstrap 5 (CSS only) + vanilla JS, built with Vite.
- **backend/** — Pure-PHP REST API (no framework), JSON-only, talks to PostgreSQL via PDO.
- **design-system/** — Brand + UI source of truth (tokens, kits, specs). Reference, not shipped.

## Run the stack

```bash
docker compose up -d --build        # or: ./start.sh  (up -d --build --force-recreate)
```

| Service | URL | Notes |
|---|---|---|
| web (frontend) | http://localhost:4173 | Vite build served by nginx |
| api (backend)  | http://localhost:8080 | Pure-PHP JSON API |
| db (PostgreSQL)| localhost:5432 | `schema.sql` + `seed.sql` loaded on first boot |

DB creds (local): db/user/pass all `ca_pharmacy`. `TAX_RATE=0.05` set in compose.yaml.

Frontend local dev: `npm install` (root), then `npm run dev` (root runs the frontend
workspace) → http://localhost:4173. API base from `VITE_API_BASE_URL` (default
`http://localhost:8080`). Start backend first: `docker compose up -d api db`.

Smoke test (needs running stack): `./backend/tests/smoke.sh` — exercises core business
rules (stock draw-down on sale, void restore, oversell rejection, PO receiving, dispensing).

## Backend architecture

Flow: `public/index.php (front controller) → Router → Controller → Service → Repository → PostgreSQL`

- **Controllers** thin: validate input, shape HTTP response. Never touch DB.
- **Services** own business rules (stock-status derivation, prescription/order/sale state
  machines, transactions, oversell guards, derived data).
- **Repositories** own SQL only (PDO).
- **No runtime deps.** Composer only for optimized autoloader; bundled PSR-4 autoloader
  (`src/autoload.php`) takes over if `vendor/` absent — runs without `composer install`.

Layout:
```
backend/src/
  Core/         Router, Request, Response, Database, Validator, Config, App, Controller, Exceptions/
  Controllers/  one per resource + Health, Dashboard
  Services/     business logic
  Repositories/ PDO data access
  Support/      Env reader, helpers.php
backend/routes/api.php      route table (closure registering routes; handlers = [Class, method])
backend/config/config.php   env-driven config (app.tax_rate, db.*)
backend/database/           schema.sql + seed.sql (auto-loaded by db container)
```

### API conventions
- Success wrapped: `{ "data": ... }`. `201` on create, `204` on delete.
- Errors: `{ "error": { "status", "message", "fields?": {field: [msgs]} } }`.
  `422` validation/business-rule, `404` not found, `405` wrong method.
- Money/quantity = numbers; dates = `YYYY-MM-DD`.

### Endpoints (see backend/README.md for full reference)
- **Auth:** `POST /api/auth/login` (`{email, password}` → `{token, expires_at, user}`),
  `GET /api/auth/me` (bearer token → current user), `POST /api/auth/logout` (revokes token).
  Bearer-token auth: bcrypt passwords (`users`), opaque token whose SHA-256 is stored
  (`sessions`), `Authorization: Bearer <token>` header. `401` on bad creds/missing/expired.
  TTL `AUTH_SESSION_TTL` (default 12h). Seeded users (pw `password123`): `jade@capharmacy.com`,
  `admin@capharmacy.com`. **Endpoints are not yet enforced server-side** — login is wired,
  but other routes don't require the token yet (frontend guards the UI; see Frontend).
- **Dashboard:** `GET /api/dashboard`
- **Medications:** CRUD `/api/medications[/{id}]` (filters `?search= ?category= ?controlled=true`);
  `POST /{id}/stock` (body `{delta, reason?}`); `GET /low-stock`, `/expiring` (90d), `/categories`.
  Stock **status** (`in·low·out·expiring·expired·recalled`) is **derived on read**, never stored.
- **Patients:** CRUD `/api/patients[/{id}]` (`?search=`); `allergies` is a string array.
- **Suppliers:** CRUD `/api/suppliers[/{id}]`.
- **Prescriptions:** `GET` (`?state= ?patient_id=`), `GET/{id}`, `POST`,
  `PATCH /{id}/state`. Pipeline `new → verifying → ready → dispensed` (or `→ voided`).
  → `dispensed` **draws stock down** (transactional, rejects if insufficient).
- **Purchase orders:** `GET` (`?state=`), `GET/{id}`, `POST`
  (`{supplier_id, expected_at?, items:[{medication_id, units, unit_cost?}]}`),
  `PATCH /{id}/state` (`submitted|transit|received|cancelled`). → `received` **adds stock**
  (guarded against double-receive).
- **Sales (POS):** `GET` (`?state=`), `GET/{id}`, `POST`
  (`{patient_id?, payment_method?, items:[{medication_id, quantity}]}`),
  `POST /{id}/void` (restores stock). Sale draws stock down atomically, rejects whole sale
  on oversell. Prices taken **server-side** from medication record.

### DB tables
`users, sessions, suppliers, medications, patients, prescriptions, purchase_orders,
purchase_order_items, sales, sale_items`. (`users`/`sessions` added for auth; recreate the
DB volume — `docker compose down -v` — after schema changes, init scripts only run on a
fresh volume.)

## Frontend architecture

Vite MPA. Pages in `frontend/pages/` (login, dashboard, inventory, pos, prescriptions,
patients, orders); `index.html` redirects to login. Each app page sets `<body data-page="...">`
and has empty `#appSidebar` / `#appTopbar` filled by JS.

**Login (`login.html` + `assets/js/login.js`):** standalone, pre-auth page — no app shell,
its own entry script (not `main.js`). Split layout: green brand aside + white sign-in card.
Calls the real `POST /api/auth/login`; on success stores the `{token, user}` session via
`auth` (see api.js) and redirects to `dashboard.html`. New page must be registered as a Vite
input in `vite.config.mjs`.

**Auth on the frontend** is bearer-token, managed by `auth` in `api.js`:
- `auth` stores the session under `ca_pharmacy_session` in `localStorage` ("Keep me signed
  in") or `sessionStorage`; exposes `token`, `user`, `save`, `clear`, `redirectToLogin`.
- `api.js` attaches `Authorization: Bearer <token>` to every request, and on a `401` (except
  the login call) clears the session and bounces to `login.html`.
- `main.js` guards every shell page: no token → redirect to login.
- `shell.js` shows the signed-in user in the shift card and has a topbar **sign-out** button
  (`api.logout()` → `auth.clear()` → login).

`frontend/assets/js/`:
- **main.js** — entry: route-guards on `auth.token`, then reads `data-page`, calls
  `renderShell`, `bindShellEvents`, `loadNavCounts`, `bindPageBehaviors`, then `lucide.createIcons()`.
- **api.js** — `api` client (unwraps `{data}`, throws `ApiError`, sends bearer token), base
  from `VITE_API_BASE_URL`; `auth` session store; auth calls `login`/`me`/`logout`. Shared
  helpers: `currency`, `STATUS_TONE`/`toneClass`, `formatDate` (→ "12 Aug 2026"), `initials`.
- **shell.js** — renders sidebar/topbar, nav, nav counts, signed-in user + sign-out.
- **page-behaviors.js** — per-page logic, dispatched by `pageId`. `POS_TAX_RATE = 0.05`
  mirrors API for live cart preview.
- **ui.js** — hand-rolled `toast`, promise-based form modal (`openForm`), `statusBadge`,
  `placeholder` (Bootstrap JS is NOT loaded, only CSS).
- **data.js** — static chrome only (`branch` identity, `navigation`). All domain data
  comes from the API.

CSS: `assets/css/theme.css` (design tokens) + `app.css`. Bootstrap 5.3.3 + Lucide + Google
Fonts (Hanken Grotesk, JetBrains Mono) loaded from CDN per page.

## Design system (design-system/)

Created from a written brief (no Figma/codebase import) — flag for reconciliation if real
artifacts appear. Aesthetic: **"apothecary precision"** — clinical, calm, trustworthy.

- `colors_and_type.css` — **all tokens; import/copy first, never hard-code hex.** Use
  semantic aliases (`--fg`, `--surface`, `--brand`, status vars), not raw scale steps.
- `README.md` / `SKILL.md` — brand, content & visual rules. SKILL is user-invocable
  (`ca-pharmacy-design`).
- `assets/` logos + cross motif · `preview/` spec cards · `ui_kits/console/` interactive
  JSX console (reusable components + styles.css).

### Non-negotiable rules
- **Pharmacy green** `--green-600 #0e8163` is the only large-area brand color; everything
  else slate neutral + status tints.
- **All data** (SKU, NDC, batch, quantity, price, dates) in **JetBrains Mono, tabular-nums**;
  everything else Hanken Grotesk.
- Status palette: success/in=green, warning/low=amber `#b6730a`, danger/out·expired·recall=
  red `#c5403c`, info/rx/system=blue `#2563c9`, **controlled=violet `#6b3fb0`** (always +
  shield/lock icon).
- Canonical stock states (exact phrasing): In stock · Low stock · Out of stock · Expiring
  soon · Expired · Recalled · On order.
- **Lucide icons** (stroke-only, 1.75px). Sentence case. Verbs on buttons ("Receive stock",
  "Void sale"). Exact numbers with units. **No emoji, no gradients, no exclamation marks.**
- Shell: fixed 240px left sidebar + top bar + scrolling content. 4px spacing grid. Cards =
  white + 1px hairline border + soft shadow + 10px radius. Visible green focus ring always.

## Conventions / gotchas
- Bootstrap **CSS only** is loaded — no Bootstrap JS; interactive bits are hand-rolled in
  `ui.js`.
- Stock status is derived server-side on read, never persisted.
- Sale/PO/prescription stock mutations are transactional & guarded (oversell, double-receive).
- Keep `POS_TAX_RATE` in `page-behaviors.js` in sync with backend `TAX_RATE`.
- Root `package.json` workspaces only `frontend`; run npm from repo root.
