import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Window Functions - PostgreSQL Learning',
  description: 'Learn about window functions in PostgreSQL including OVER, PARTITION BY, ROW_NUMBER, RANK, LAG, LEAD, and window frames',
};

export default function WindowFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Window Functions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">OVER Clause</h2>
          <p className="mb-4">
            Window functions use the OVER clause to define a window of rows for calculation.
          </p>

          <CodeBlock
            title="SQL: OVER Clause"
            language="sql"
            code={`-- Basic OVER clause
SELECT 
  id,
  username,
  ROW_NUMBER() OVER (ORDER BY created_at) AS row_num
FROM users;

-- OVER with PARTITION BY
SELECT 
  id,
  status,
  ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at) AS row_in_status
FROM users;

-- OVER with ORDER BY
SELECT 
  id,
  price,
  SUM(price) OVER (ORDER BY id) AS running_total
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ranking Functions</h2>

          <CodeBlock
            title="SQL: Ranking Functions"
            language="sql"
            code={`-- ROW_NUMBER (sequential numbering, no ties)
SELECT 
  id,
  username,
  score,
  ROW_NUMBER() OVER (ORDER BY score DESC) AS rank
FROM users;

-- RANK (allows ties, skips numbers)
SELECT 
  id,
  username,
  score,
  RANK() OVER (ORDER BY score DESC) AS rank
FROM users;
-- Scores: 100, 100, 90 -> Ranks: 1, 1, 3

-- DENSE_RANK (allows ties, no gaps)
SELECT 
  id,
  username,
  score,
  DENSE_RANK() OVER (ORDER BY score DESC) AS rank
FROM users;
-- Scores: 100, 100, 90 -> Ranks: 1, 1, 2

-- PERCENT_RANK (relative rank as percentage)
SELECT 
  id,
  score,
  PERCENT_RANK() OVER (ORDER BY score DESC) AS percent_rank
FROM users;

-- CUME_DIST (cumulative distribution)
SELECT 
  id,
  score,
  CUME_DIST() OVER (ORDER BY score DESC) AS cumulative_dist
FROM users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Value Functions</h2>

          <CodeBlock
            title="SQL: LAG, LEAD, FIRST_VALUE, LAST_VALUE"
            language="sql"
            code={`-- LAG (previous row value)
SELECT 
  id,
  price,
  LAG(price) OVER (ORDER BY id) AS previous_price,
  LAG(price, 2) OVER (ORDER BY id) AS price_2_ago
FROM products;

-- LEAD (next row value)
SELECT 
  id,
  price,
  LEAD(price) OVER (ORDER BY id) AS next_price,
  LEAD(price, 2) OVER (ORDER BY id) AS price_2_ahead
FROM products;

-- FIRST_VALUE (first value in window)
SELECT 
  id,
  price,
  FIRST_VALUE(price) OVER (ORDER BY id) AS first_price,
  FIRST_VALUE(price) OVER (PARTITION BY category_id ORDER BY id) AS first_in_category
FROM products;

-- LAST_VALUE (last value in window)
SELECT 
  id,
  price,
  LAST_VALUE(price) OVER (
    ORDER BY id 
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
  ) AS last_price
FROM products;

-- NTH_VALUE (nth value in window)
SELECT 
  id,
  price,
  NTH_VALUE(price, 2) OVER (ORDER BY id) AS second_price
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">NTILE</h2>

          <CodeBlock
            title="SQL: NTILE"
            language="sql"
            code={`-- NTILE (divides rows into buckets)
SELECT 
  id,
  username,
  score,
  NTILE(4) OVER (ORDER BY score DESC) AS quartile
FROM users;
-- Divides into 4 equal groups

-- NTILE with PARTITION BY
SELECT 
  id,
  category_id,
  price,
  NTILE(3) OVER (PARTITION BY category_id ORDER BY price DESC) AS price_tier
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Aggregate Window Functions</h2>

          <CodeBlock
            title="SQL: Aggregate Window Functions"
            language="sql"
            code={`-- SUM as window function
SELECT 
  id,
  price,
  SUM(price) OVER (ORDER BY id) AS running_total,
  SUM(price) OVER (PARTITION BY category_id) AS category_total
FROM products;

-- AVG as window function
SELECT 
  id,
  price,
  AVG(price) OVER (PARTITION BY category_id) AS avg_category_price
FROM products;

-- COUNT as window function
SELECT 
  id,
  status,
  COUNT(*) OVER (PARTITION BY status) AS status_count
FROM users;

-- Multiple aggregates
SELECT 
  id,
  price,
  category_id,
  SUM(price) OVER (PARTITION BY category_id) AS category_sum,
  AVG(price) OVER (PARTITION BY category_id) AS category_avg,
  COUNT(*) OVER (PARTITION BY category_id) AS category_count
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Window Frame Specifications</h2>

          <CodeBlock
            title="SQL: Window Frames"
            language="sql"
            code={`-- ROWS frame (physical rows)
SELECT 
  id,
  price,
  SUM(price) OVER (
    ORDER BY id 
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS sum_3_rows
FROM products;

-- RANGE frame (logical range)
SELECT 
  id,
  price,
  SUM(price) OVER (
    ORDER BY price 
    RANGE BETWEEN 10 PRECEDING AND CURRENT ROW
  ) AS sum_within_10
FROM products;

-- Frame specifications:
-- UNBOUNDED PRECEDING (start of partition)
-- n PRECEDING (n rows/values before)
-- CURRENT ROW (current row)
-- n FOLLOWING (n rows/values after)
-- UNBOUNDED FOLLOWING (end of partition)

-- Examples:
SELECT 
  id,
  price,
  SUM(price) OVER (ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative,
  SUM(price) OVER (ORDER BY id ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) AS remaining,
  AVG(price) OVER (ORDER BY id ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS moving_avg
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Window Functions</h2>

          <CodeBlock
            title="Prisma: Window Functions"
            language="prisma"
            code={`// Prisma doesn't support window functions directly
// Use raw SQL for all window function operations

// ROW_NUMBER
const users = await prisma.$queryRaw\`
  SELECT 
    id,
    username,
    ROW_NUMBER() OVER (ORDER BY created_at) AS row_num
  FROM users
\`;

// RANK with PARTITION BY
const products = await prisma.$queryRaw\`
  SELECT 
    id,
    price,
    category_id,
    RANK() OVER (PARTITION BY category_id ORDER BY price DESC) AS rank_in_category
  FROM products
\`;

// LAG/LEAD
const prices = await prisma.$queryRaw\`
  SELECT 
    id,
    price,
    LAG(price) OVER (ORDER BY id) AS previous_price,
    LEAD(price) OVER (ORDER BY id) AS next_price
  FROM products
\`;

// Aggregate window functions
const stats = await prisma.$queryRaw\`
  SELECT 
    id,
    price,
    category_id,
    SUM(price) OVER (PARTITION BY category_id) AS category_total,
    AVG(price) OVER (PARTITION BY category_id) AS category_avg
  FROM products
\`;

// Window frames
const running = await prisma.$queryRaw\`
  SELECT 
    id,
    price,
    SUM(price) OVER (
      ORDER BY id 
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS sum_3_rows
  FROM products
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

