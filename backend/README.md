# CA Pharmacy — API

Pure-PHP REST API for selling medications and controlling pharmacy stock. No
framework, no templating engine (no Blade / views) — it speaks **JSON only**.

## Architecture

A small MVC core with an explicit **service layer**. Requests flow:

```
HTTP → public/index.php (front controller)
     → Router            (matches method + path, binds {params})
     → Controller        (validates input, shapes the HTTP response)
     → Service            (business rules, transactions, derived data)
     → Repository         (SQL via PDO)
     → PostgreSQL
```

- **Controllers** stay thin: validate the request, call a service, return a
  `Response`. They never touch the database.
- **Services** own the business rules — stock-status derivation, the
  prescription state machine, "selling draws down stock", "receiving a PO adds
  stock", oversell guards, transactional integrity.
- **Repositories** own the SQL and nothing else.

```
src/
  Core/            Router, Request, Response, Database, Validator, Config, App, Controller, Exceptions/
  Controllers/     HTTP endpoints (one per resource) + Health, Dashboard
  Services/        business logic
  Repositories/    PDO data access
  Support/         Env reader, global helpers
routes/api.php     the route table
config/config.php  env-driven configuration
database/          schema.sql + seed.sql (auto-loaded by the db container)
```

There are **no third-party runtime dependencies**. Composer is used only to
generate an optimized autoloader; if `vendor/` is absent, a bundled PSR-4
autoloader (`src/autoload.php`) takes over, so the app runs without
`composer install`.

## Running

From the repository root (one level up):

```bash
docker compose up -d --build
```

This starts PostgreSQL (with `schema.sql` + `seed.sql` loaded on first boot) and
the API. The API is then at <http://localhost:8080>.

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/dashboard
```

Configuration is environment-driven (see `.env.example`): `DB_*`, `APP_DEBUG`,
`TAX_RATE` (sales tax fraction applied at point of sale, e.g. `0.08`), and
`AUTH_SESSION_TTL` (bearer-token lifetime in seconds, default `43200` = 12h).

> Note: `schema.sql`/`seed.sql` only run when the DB volume is first created.
> After changing them (e.g. the new `users`/`sessions` tables), recreate the
> volume: `docker compose down -v && docker compose up -d --build`.

## Conventions

- Success responses are wrapped: `{ "data": ... }`. `201` on create, `204` on
  delete.
- Errors are `{ "error": { "status", "message", "fields?": {field: [msgs]} } }`.
  `422` for validation/business-rule failures, `404` not found, `405` wrong
  method.
- All money/quantity fields are returned as numbers; dates as `YYYY-MM-DD`.
- Authentication is bearer-token: sign in to receive a token, then send it as
  `Authorization: Bearer <token>` on later requests. Auth failures return `401`.

## Endpoints

### Authentication
| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login` | Body `{ "email", "password" }` → `{ token, expires_at, user }`. `401` on bad credentials, `422` on invalid input |
| GET | `/api/auth/me` | Requires `Authorization: Bearer <token>` → the current `user`. `401` if missing/expired/revoked |
| POST | `/api/auth/logout` | Revokes the bearer token (deletes its session). `204` |

Passwords are stored as bcrypt hashes (`users` table). A session stores only the
SHA-256 of the opaque token (`sessions` table), so the raw token never touches the
database; tokens expire after `AUTH_SESSION_TTL` seconds (default 12h) and are
revoked on logout. Seeded demo users (password `password123`):
`jade@capharmacy.com` (pharmacist) and `admin@capharmacy.com` (admin).

### Dashboard
| Method | Path | Notes |
|---|---|---|
| GET | `/api/dashboard` | Today's sales, dispensing queue, weekly trend, low-stock & expiry alerts |

### Medications (inventory / stock control)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/medications` | Filters: `?search=`, `?category=`, `?controlled=true` |
| GET | `/api/medications/{id}` | |
| POST | `/api/medications` | |
| PUT / PATCH | `/api/medications/{id}` | |
| DELETE | `/api/medications/{id}` | |
| POST | `/api/medications/{id}/stock` | Body `{ "delta": ±n, "reason"? }` — goods-in / correction / write-off |
| GET | `/api/medications/low-stock` | At/below reorder point |
| GET | `/api/medications/expiring` | Expiring within 90 days |
| GET | `/api/medications/categories` | Distinct categories |

Stock **status** (`in` · `low` · `out` · `expiring` · `expired` · `recalled`) is
derived on read from on-hand, reorder point, expiry and the recalled flag — never
stored, so it can't go stale.

### Patients
| Method | Path | Notes |
|---|---|---|
| GET | `/api/patients` | `?search=` |
| GET | `/api/patients/{id}` | Includes prescriptions + active count |
| POST / PUT / PATCH / DELETE | `/api/patients/{id}` | `allergies` is a string array |

### Suppliers
| Method | Path |
|---|---|
| GET / POST | `/api/suppliers` |
| GET / PUT / PATCH / DELETE | `/api/suppliers/{id}` |

### Prescriptions
| Method | Path | Notes |
|---|---|---|
| GET | `/api/prescriptions` | `?state=`, `?patient_id=` |
| GET | `/api/prescriptions/{id}` | |
| POST | `/api/prescriptions` | Controlled meds auto-flag `controlled` |
| PATCH | `/api/prescriptions/{id}/state` | `{ "state": "verifying\|ready\|dispensed\|voided" }` |

Pipeline: `new → verifying → ready → dispensed` (or `→ voided`). Transitioning to
`dispensed` **draws the quantity down from stock** in a transaction and rejects
the move if stock is insufficient.

### Purchase orders (restocking)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/purchase-orders` | `?state=` |
| GET | `/api/purchase-orders/{id}` | Includes line items + totals |
| POST | `/api/purchase-orders` | `{ supplier_id, expected_at?, items: [{medication_id, units, unit_cost?}] }` |
| PATCH | `/api/purchase-orders/{id}/state` | `{ "state": "submitted\|transit\|received\|cancelled" }` |

Marking an order `received` **adds the ordered units into stock** (transactional,
guarded against double-receive).

### Sales (point of sale)
| Method | Path | Notes |
|---|---|---|
| GET | `/api/sales` | `?state=` |
| GET | `/api/sales/{id}` | Includes line items |
| POST | `/api/sales` | `{ patient_id?, payment_method?, items: [{medication_id, quantity}] }` |
| POST | `/api/sales/{id}/void` | Restores the sold stock |

Completing a sale **draws each line's quantity down from stock** atomically and
rejects the whole sale if any line would oversell. Prices are taken server-side
from the medication record. Voiding puts the stock back.

## Example

```bash
# Ring up a sale (server prices each line, decrements stock atomically)
curl -X POST http://localhost:8080/api/sales \
  -H 'Content-Type: application/json' \
  -d '{"payment_method":"card","items":[{"medication_id":9,"quantity":3}]}'
```
