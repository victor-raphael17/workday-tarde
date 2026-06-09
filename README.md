CA Pharmacy is a system that controls pharmacy medication sales and stock. It consists of a frontend built with HTML, Bootstrap (CSS), and JavaScript, and an API developed using pure PHP. The frontend design is located in the `/design-system` directory. The database is a PostgreSQL instance. The frontend, backend, and database are all dockerized.

The frontend talks to the API over HTTP/JSON — every page (dashboard, inventory, point of sale, prescriptions, patients, orders) reads and writes live data through the endpoints documented in `backend/README.md`.

## Run the whole stack (Docker)

From the repository root:

```bash
docker compose up -d --build
```

This starts three services:

| Service | URL | Notes |
|---|---|---|
| `web` (frontend) | <http://localhost:4173> | Vite build served by nginx |
| `api` (backend) | <http://localhost:8080> | Pure-PHP JSON API |
| `db` (PostgreSQL) | localhost:5432 | `schema.sql` + `seed.sql` loaded on first boot |

Open <http://localhost:4173> and you land on the dashboard, populated from the API. `TAX_RATE` is set to `0.05` in `compose.yaml`, matching the 5% line shown at point of sale.

## Frontend (local dev)

The frontend lives in `frontend/` and runs with Vite. Install dependencies from the repository root:

```bash
npm install
```

Start the dev server (proxying to the API at `http://localhost:8080` — start the backend with `docker compose up -d api db` first):

```bash
npm run dev      # http://localhost:4173
npm run build    # production build into frontend/dist
npm run preview  # preview the production build
```

The API base URL is read from `VITE_API_BASE_URL` (see `frontend/.env.example`); it defaults to `http://localhost:8080`.

## Backend

See `backend/README.md` for the full architecture and endpoint reference.

## Tests

An end-to-end smoke test exercises the core business rules (stock draw-down on sale, void restore, oversell rejection, purchase-order receiving, prescription dispensing) against a running API:

```bash
docker compose up -d --build
./backend/tests/smoke.sh
```
