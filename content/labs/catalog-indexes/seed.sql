CREATE TABLE entries (id INTEGER PRIMARY KEY, category TEXT, price INTEGER);
WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 2000
)
INSERT INTO entries
SELECT n, CASE WHEN n % 10 = 0 THEN 'history' ELSE 'computing' END,
       n % 97
FROM numbers;
