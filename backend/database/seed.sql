-- CA Pharmacy — seed data (derived from the design-system demo dataset).
-- Loaded after schema.sql on first container boot. Safe to re-run on a fresh DB.

BEGIN;

-- Users (ids 1..2) -----------------------------------------------------------
-- Demo password for every seeded user is "password123" (bcrypt-hashed below).
-- Change these before any non-local deployment.
INSERT INTO users (name, email, password_hash, role) VALUES
    ('Jade Okafor', 'jade@capharmacy.com',  '$2y$12$zIxf9wmd7ystFv5UYHfcCOsPHzeVYgRvuNOaaraRw0EKkLAu7xE/G', 'pharmacist'),
    ('Site Admin',  'admin@capharmacy.com', '$2y$12$0nQr65a6tKu4639ypqNgcOIYJIaejYalECmh2CNc8Ih2Pn48dfN1a', 'admin');

-- Suppliers (ids 1..3 on a fresh sequence) -----------------------------------
INSERT INTO suppliers (name, contact_email, phone) VALUES
    ('MedSource Distribution', 'orders@medsource.example', '(555) 0700'),
    ('Caldwell Wholesale',     'sales@caldwell.example',   '(555) 0711'),
    ('Apex Pharma Supply',     'desk@apexpharma.example',  '(555) 0722');

-- Medications (ids 1..12) ----------------------------------------------------
INSERT INTO medications (sku, name, strength, form, category, on_hand, reorder_point, price, expiry, controlled) VALUES
    ('CA-AMX-500', 'Amoxicillin',  '500 mg',  'Capsule', 'Antibiotics',    24, 10, 12.40, '2026-08-12', FALSE),
    ('CA-IBU-200', 'Ibuprofen',    '200 mg',  'Tablet',  'Analgesics',      8, 20,  5.10, '2027-03-03', FALSE),
    ('CA-MET-850', 'Metformin',    '850 mg',  'Tablet',  'Diabetes',       61, 25,  9.75, '2026-11-21', FALSE),
    ('CA-OXY-05',  'Oxycodone',    '5 mg',    'Tablet',  'Opioids',        14, 10, 28.90, '2026-06-09', TRUE),
    ('CA-LIS-10',  'Lisinopril',   '10 mg',   'Tablet',  'Cardiovascular',  0, 15,  7.30, '2027-01-30', FALSE),
    ('CA-SAL-100', 'Salbutamol',   '100 mcg', 'Inhaler', 'Respiratory',     5, 12, 14.20, '2026-07-18', FALSE),
    ('CA-ATO-20',  'Atorvastatin', '20 mg',   'Tablet',  'Cardiovascular', 88, 30, 11.05, '2027-09-14', FALSE),
    ('CA-DIA-05',  'Diazepam',     '5 mg',    'Tablet',  'Anxiolytics',     9,  8, 19.60, '2026-05-02', TRUE),
    ('CA-PAR-500', 'Paracetamol',  '500 mg',  'Tablet',  'Analgesics',    142, 40,  3.80, '2027-12-27', FALSE),
    ('CA-OME-20',  'Omeprazole',   '20 mg',   'Capsule', 'Gastro',         33, 20,  8.45, '2026-04-05', FALSE),
    ('CA-CET-10',  'Cetirizine',   '10 mg',   'Tablet',  'Antihistamine',  56, 25,  4.60, '2027-10-11', FALSE),
    ('CA-AML-5',   'Amlodipine',   '5 mg',    'Tablet',  'Cardiovascular', 18, 20,  6.90, '2026-02-22', FALSE);

-- Patients (ids 1..8) --------------------------------------------------------
INSERT INTO patients (code, name, dob, phone, plan, allergies, last_visit) VALUES
    ('PT-4821', 'Amara Okafor',    '1989-03-14', '(555) 0142', 'MedAid Plus', ARRAY['Penicillin'],         '2026-06-05'),
    ('PT-4822', 'James Whitlock',  '1972-09-02', '(555) 0188', 'StateCare',   ARRAY[]::TEXT[],             '2026-06-05'),
    ('PT-4823', 'Sofia Marchetti', '1995-01-27', '(555) 0211', 'MedAid Plus', ARRAY['Sulfa drugs','Aspirin'], '2026-06-05'),
    ('PT-4824', 'Daniel Kim',      '1980-11-19', '(555) 0267', 'Self-pay',    ARRAY[]::TEXT[],             '2026-06-05'),
    ('PT-4825', 'Grace Mensah',    '1968-07-08', '(555) 0319', 'StateCare',   ARRAY['Codeine'],            '2026-06-04'),
    ('PT-4826', 'Tomás Rivera',    '1991-04-30', '(555) 0344', 'MedAid Plus', ARRAY[]::TEXT[],             '2026-06-03'),
    ('PT-4827', 'Priya Nair',      '1985-12-11', '(555) 0390', 'Self-pay',    ARRAY['Latex'],              '2026-06-02'),
    ('PT-4828', 'Wei Chen',        '1958-02-23', '(555) 0421', 'StateCare',   ARRAY['Penicillin','NSAIDs'], '2026-06-01');

-- Prescriptions --------------------------------------------------------------
INSERT INTO prescriptions (code, patient_id, medication_id, quantity, unit, prescriber, state, flag) VALUES
    ('RX-10293', 1,  1, 21, 'caps',    'Dr. L. Hahn',    'new',       NULL),
    ('RX-10294', 2,  4, 14, 'tabs',    'Dr. P. Adeyemi', 'verifying', 'controlled'),
    ('RX-10295', 3,  5, 30, 'tabs',    'Dr. R. Singh',   'verifying', 'interaction'),
    ('RX-10296', 4,  6,  1, 'inhaler', 'Dr. L. Hahn',    'ready',     NULL),
    ('RX-10297', 5,  3, 56, 'tabs',    'Dr. R. Singh',   'ready',     NULL),
    ('RX-10298', 6,  8, 10, 'tabs',    'Dr. P. Adeyemi', 'dispensed', 'controlled');

-- Purchase orders + items ----------------------------------------------------
INSERT INTO purchase_orders (code, supplier_id, state, expected_at, received_at) VALUES
    ('PO-2061', 1, 'transit',   '2026-06-07', NULL),
    ('PO-2060', 2, 'submitted', '2026-06-06', NULL),
    ('PO-2059', 1, 'received',  '2026-06-05', '2026-06-05 09:30:00+00'),
    ('PO-2058', 3, 'received',  '2026-06-04', '2026-06-04 14:10:00+00'),
    ('PO-2057', 2, 'draft',     NULL,         NULL);

INSERT INTO purchase_order_items (purchase_order_id, medication_id, units, unit_cost) VALUES
    (1,  1, 120,  7.10),   -- PO-2061
    (1,  3, 100,  5.40),
    (1,  7, 100,  6.50),
    (2,  2,  40,  2.80),   -- PO-2060
    (2,  9,  50,  1.90),
    (3,  5, 200,  4.10),   -- PO-2059 (received)
    (3, 10, 120,  4.60),
    (3,  6, 220,  8.30),
    (4, 11,  24,  2.40),   -- PO-2058 (received)
    (4, 12,  24,  3.80),
    (5,  4,  60, 18.20),   -- PO-2057 (draft)
    (5,  8, 100, 12.10);

-- A couple of completed sales today (so the dashboard has data) --------------
INSERT INTO sales (code, patient_id, subtotal, tax, total, payment_method, state) VALUES
    ('SL-10291', 7, 12.40, 1.00, 13.40, 'card', 'completed'),
    ('SL-10292', NULL, 11.40, 0.91, 12.31, 'cash', 'completed');

INSERT INTO sale_items (sale_id, medication_id, quantity, unit_price) VALUES
    (1,  9, 2, 3.80),
    (1, 11, 1, 4.60),
    (2,  2, 1, 5.10),
    (2,  9, 1, 3.80),
    (2, 12, 1, 6.90);

COMMIT;
