-- Fixture: a minimal order-management schema.
--
-- Design notes for authors:
--   * constraints are real (primary key, foreign key, unique, not null, check),
--     so examples can show integrity rules being enforced rather than asserting
--     them;
--   * `customers.country` and `orders.discount_cents` are nullable, so
--     three-valued logic can be observed instead of described;
--   * customer 4 has no orders, product 4 is never ordered, and order 1003 has
--     no items: outer joins, anti-joins and fan-out have non-empty results;
--   * money is stored in integer cents to avoid floating point discussion in
--     lessons that are not about numeric representation.

PRAGMA foreign_keys = ON;

CREATE TABLE customers (
    customer_id   INTEGER PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    full_name     TEXT NOT NULL,
    country       TEXT,
    referral_code TEXT UNIQUE
);

CREATE TABLE products (
    product_id       INTEGER PRIMARY KEY,
    sku              TEXT NOT NULL UNIQUE,
    name             TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
);

CREATE TABLE orders (
    order_id       INTEGER PRIMARY KEY,
    customer_id    INTEGER NOT NULL REFERENCES customers (customer_id),
    placed_on      TEXT NOT NULL,
    status         TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
    discount_cents INTEGER CHECK (discount_cents IS NULL OR discount_cents >= 0)
);

CREATE TABLE order_items (
    order_id   INTEGER NOT NULL REFERENCES orders (order_id),
    product_id INTEGER NOT NULL REFERENCES products (product_id),
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (order_id, product_id)
);

INSERT INTO customers (customer_id, email, full_name, country, referral_code) VALUES
    (1, 'ada@example.com',     'Ada Lovelace',    'GB',  'REF-ADA'),
    (2, 'grace@example.com',   'Grace Hopper',    'US',  NULL),
    (3, 'edsger@example.com',  'Edsger Dijkstra', NULL,  NULL),
    (4, 'barbara@example.com', 'Barbara Liskov',  'US',  'REF-BAR');

INSERT INTO products (product_id, sku, name, unit_price_cents) VALUES
    (1, 'BK-CS-001', 'Computing Machinery Primer', 4200),
    (2, 'BK-CS-002', 'Programming Languages',      3800),
    (3, 'BK-CS-003', 'Operating Systems Reader',   5600),
    (4, 'BK-CS-004', 'Distributed Systems Notes',  6100);

INSERT INTO orders (order_id, customer_id, placed_on, status, discount_cents) VALUES
    (1001, 1, '2026-01-04', 'paid',      500),
    (1002, 1, '2026-01-19', 'shipped',   NULL),
    (1003, 2, '2026-02-02', 'pending',   0),
    (1004, 3, '2026-02-11', 'cancelled', NULL),
    (1005, 2, '2026-02-20', 'paid',      200),
    (1006, 3, '2026-03-01', 'pending',   0);

INSERT INTO order_items (order_id, product_id, quantity) VALUES
    (1001, 1, 1),
    (1001, 2, 2),
    (1002, 3, 1),
    (1004, 1, 3),
    (1005, 3, 1),
    (1005, 1, 2);
