-- Fixture: a minimal order-management schema.
--
-- Design notes for authors:
--   * constraints are real (PK, FK, UNIQUE, NOT NULL, CHECK), so examples can
--     show integrity rules rather than asserting them;
--   * `customers.country` and `orders.discount_cents` are nullable, so NULL
--     behaviour can be observed instead of described;
--   * one order has no items and one product is never ordered, so outer joins
--     and anti-joins have non-empty results;
--   * money is stored in integer cents to avoid floating point discussion in
--     lessons that are not about numeric representation.

PRAGMA foreign_keys = ON;

CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    full_name   TEXT NOT NULL,
    country     TEXT
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

INSERT INTO customers (customer_id, email, full_name, country) VALUES
    (1, 'ada@example.com',    'Ada Lovelace',   'GB'),
    (2, 'grace@example.com',  'Grace Hopper',   'US'),
    (3, 'edsger@example.com', 'Edsger Dijkstra', NULL);

INSERT INTO products (product_id, sku, name, unit_price_cents) VALUES
    (1, 'BK-CS-001', 'Computing Machinery Primer', 4200),
    (2, 'BK-CS-002', 'Programming Languages',      3800),
    (3, 'BK-CS-003', 'Operating Systems Reader',   5600);

INSERT INTO orders (order_id, customer_id, placed_on, status, discount_cents) VALUES
    (1001, 1, '2026-01-04', 'paid',     500),
    (1002, 1, '2026-01-19', 'shipped',  NULL),
    (1003, 2, '2026-02-02', 'pending',  0),
    (1004, 3, '2026-02-11', 'cancelled', NULL);

INSERT INTO order_items (order_id, product_id, quantity) VALUES
    (1001, 1, 1),
    (1001, 2, 2),
    (1002, 3, 1),
    (1004, 1, 3);
