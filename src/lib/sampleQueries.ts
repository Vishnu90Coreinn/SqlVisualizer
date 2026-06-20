export interface SampleQuery {
  label: string;
  description: string;
  sql: string;
}

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    label: 'Simple join',
    description: 'JOIN two tables with WHERE and ORDER BY',
    sql: `SELECT o.id, o.amount, c.customer_name, c.region
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.amount > 100
ORDER BY o.amount DESC;`,
  },
  {
    label: 'CTE + window function',
    description: 'Multi-CTE with RANK() OVER and an IN subquery',
    sql: `WITH regional_sales AS (
  SELECT region, SUM(amount) AS total_sales
  FROM orders
  WHERE order_date >= '2024-01-01'
  GROUP BY region
),
top_regions AS (
  SELECT region
  FROM regional_sales
  WHERE total_sales > 1000
)
SELECT
  c.customer_name,
  o.region,
  o.amount,
  RANK() OVER (PARTITION BY o.region ORDER BY o.amount DESC) AS rnk
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.region IN (SELECT region FROM top_regions)
ORDER BY o.amount DESC
LIMIT 10;`,
  },
  {
    label: 'Nested subquery + EXISTS',
    description: 'Derived table in FROM with a correlated EXISTS',
    sql: `SELECT t.id, t.total
FROM (
  SELECT customer_id AS id, SUM(amount) AS total
  FROM orders
  GROUP BY customer_id
) t
WHERE EXISTS (
  SELECT 1 FROM customers c
  WHERE c.id = t.id AND c.active = true
)
ORDER BY t.total DESC;`,
  },
  {
    label: 'Four-way join chain',
    description: 'LEFT JOIN across four tables in one query',
    sql: `SELECT p.name, o.id AS order_id, s.shipped_at
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN shipments s ON s.order_id = o.id
WHERE o.status = 'completed';`,
  },
];
