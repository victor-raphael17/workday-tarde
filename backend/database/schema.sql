-- CA Pharmacy — database schema (PostgreSQL)
-- Loaded automatically by the Postgres container on first boot.

BEGIN;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Users (staff who sign in to the console) + sessions (bearer tokens)
-- Passwords are stored as bcrypt hashes (password_hash); sessions hold the
-- SHA-256 of an opaque bearer token, never the token itself.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(160) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL DEFAULT 'pharmacist'
                  CHECK (role IN ('pharmacist', 'technician', 'admin')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX users_email_idx ON users (lower(email));

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sessions (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sessions_token_idx ON sessions (token_hash);
CREATE INDEX sessions_user_idx ON sessions (user_id);

-- ---------------------------------------------------------------------------
-- Suppliers (who we buy stock from)
-- ---------------------------------------------------------------------------
CREATE TABLE suppliers (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(160) NOT NULL,
    contact_email VARCHAR(160),
    phone         VARCHAR(40),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Medications (the stock-controlled catalogue)
-- Stock state (in / low / out / expiring / expired / recalled) is derived in
-- the service layer from on_hand, reorder_point, expiry and the recalled flag.
-- ---------------------------------------------------------------------------
CREATE TABLE medications (
    id            SERIAL PRIMARY KEY,
    sku           VARCHAR(40) NOT NULL UNIQUE,
    name          VARCHAR(160) NOT NULL,
    strength      VARCHAR(40),
    form          VARCHAR(40),
    category      VARCHAR(80),
    on_hand       INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reorder_point INTEGER NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    price         NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    expiry        DATE,
    controlled    BOOLEAN NOT NULL DEFAULT FALSE,
    recalled      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX medications_category_idx ON medications (category);
CREATE INDEX medications_name_idx ON medications (lower(name));

CREATE TRIGGER medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------
CREATE TABLE patients (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(20) NOT NULL UNIQUE,
    name       VARCHAR(160) NOT NULL,
    dob        DATE,
    phone      VARCHAR(40),
    plan       VARCHAR(80),
    allergies  TEXT[] NOT NULL DEFAULT '{}',
    last_visit DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Prescriptions (intake -> verify -> ready -> dispensed)
-- ---------------------------------------------------------------------------
CREATE TABLE prescriptions (
    id            SERIAL PRIMARY KEY,
    code          VARCHAR(20) NOT NULL UNIQUE,
    patient_id    INTEGER NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
    medication_id INTEGER NOT NULL REFERENCES medications (id) ON DELETE RESTRICT,
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    unit          VARCHAR(20) NOT NULL DEFAULT 'units',
    prescriber    VARCHAR(120) NOT NULL,
    state         VARCHAR(20) NOT NULL DEFAULT 'new'
                  CHECK (state IN ('new', 'verifying', 'ready', 'dispensed', 'voided')),
    flag          VARCHAR(20) CHECK (flag IN ('controlled', 'interaction', 'allergy')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prescriptions_state_idx ON prescriptions (state);
CREATE INDEX prescriptions_patient_idx ON prescriptions (patient_id);

CREATE TRIGGER prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Purchase orders (restocking) + line items
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_orders (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers (id) ON DELETE RESTRICT,
    state       VARCHAR(20) NOT NULL DEFAULT 'draft'
                CHECK (state IN ('draft', 'submitted', 'transit', 'received', 'cancelled')),
    expected_at DATE,
    received_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX purchase_orders_state_idx ON purchase_orders (state);

CREATE TRIGGER purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE purchase_order_items (
    id                SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders (id) ON DELETE CASCADE,
    medication_id     INTEGER NOT NULL REFERENCES medications (id) ON DELETE RESTRICT,
    units             INTEGER NOT NULL CHECK (units > 0),
    unit_cost         NUMERIC(10, 2) NOT NULL CHECK (unit_cost >= 0)
);

CREATE INDEX purchase_order_items_order_idx ON purchase_order_items (purchase_order_id);

-- ---------------------------------------------------------------------------
-- Sales (point of sale) + line items
-- ---------------------------------------------------------------------------
CREATE TABLE sales (
    id             SERIAL PRIMARY KEY,
    code           VARCHAR(20) NOT NULL UNIQUE,
    patient_id     INTEGER REFERENCES patients (id) ON DELETE SET NULL,
    subtotal       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax            NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total          NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash'
                   CHECK (payment_method IN ('cash', 'card', 'insurance')),
    state          VARCHAR(20) NOT NULL DEFAULT 'completed'
                   CHECK (state IN ('completed', 'voided')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sales_created_idx ON sales (created_at);

CREATE TRIGGER sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE sale_items (
    id            SERIAL PRIMARY KEY,
    sale_id       INTEGER NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
    medication_id INTEGER NOT NULL REFERENCES medications (id) ON DELETE RESTRICT,
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    unit_price    NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX sale_items_sale_idx ON sale_items (sale_id);

COMMIT;
