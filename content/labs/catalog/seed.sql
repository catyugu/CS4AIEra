PRAGMA foreign_keys = ON;
CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER CHECK (price >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0)
) STRICT;
CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    book_id INTEGER NOT NULL REFERENCES books(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
) STRICT;
INSERT INTO books VALUES
    (1, '程序与状态', 'computing', 80, 3),
    (2, '数据与查询', 'computing', NULL, 0),
    (3, '历史资料', 'history', 50, 5),
    (4, '历史索引', 'history', 50, 2);
INSERT INTO orders VALUES (10, 'r10', 1, 2), (11, 'r11', 1, 1), (12, 'r12', 3, 2);
