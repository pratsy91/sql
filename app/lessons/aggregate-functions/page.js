import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Aggregate Functions - PostgreSQL Learning',
  description: 'Learn about aggregate functions in PostgreSQL including COUNT, SUM, AVG, MIN, MAX, STRING_AGG, ARRAY_AGG, JSON_AGG, and statistical functions',
};

export default function AggregateFunctions() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Aggregate Functions</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Aggregate Functions</h2>

          <CodeBlock
            title="SQL: Basic Aggregates"
            language="sql"
            code={`-- COUNT
SELECT COUNT(*) FROM users;  -- Count all rows
SELECT COUNT(id) FROM users;  -- Count non-NULL values
SELECT COUNT(DISTINCT status) FROM users;  -- Count distinct values

-- SUM
SELECT SUM(price) FROM products;
SELECT SUM(quantity * price) FROM order_items;

-- AVG
SELECT AVG(price) FROM products;
SELECT AVG(DISTINCT price) FROM products;  -- Average of distinct values

-- MIN and MAX
SELECT MIN(price), MAX(price) FROM products;
SELECT MIN(created_at), MAX(created_at) FROM users;

-- All aggregates together
SELECT 
  COUNT(*) AS total_products,
  SUM(price) AS total_value,
  AVG(price) AS avg_price,
  MIN(price) AS min_price,
  MAX(price) AS max_price
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">STRING_AGG and ARRAY_AGG</h2>

          <CodeBlock
            title="SQL: STRING_AGG and ARRAY_AGG"
            language="sql"
            code={`-- STRING_AGG (concatenate strings)
SELECT 
  status,
  STRING_AGG(username, ', ') AS usernames,
  STRING_AGG(username, ', ' ORDER BY username) AS sorted_usernames
FROM users
GROUP BY status;

-- STRING_AGG with DISTINCT
SELECT 
  category_id,
  STRING_AGG(DISTINCT tag, ', ') AS unique_tags
FROM product_tags
GROUP BY category_id;

-- ARRAY_AGG (create array)
SELECT 
  status,
  ARRAY_AGG(username) AS username_array,
  ARRAY_AGG(username ORDER BY username) AS sorted_array
FROM users
GROUP BY status;

-- ARRAY_AGG with DISTINCT
SELECT 
  category_id,
  ARRAY_AGG(DISTINCT tag) AS unique_tags
FROM product_tags
GROUP BY category_id;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">JSON_AGG and JSONB_AGG</h2>

          <CodeBlock
            title="SQL: JSON Aggregation"
            language="sql"
            code={`-- JSON_AGG (create JSON array)
SELECT 
  status,
  JSON_AGG(username) AS usernames_json,
  JSON_AGG(ROW(username, email)) AS user_data_json
FROM users
GROUP BY status;

-- JSONB_AGG (create JSONB array, more efficient)
SELECT 
  category_id,
  JSONB_AGG(
    JSONB_BUILD_OBJECT('id', id, 'name', name, 'price', price)
  ) AS products_jsonb
FROM products
GROUP BY category_id;

-- JSON_AGG with ORDER BY
SELECT 
  status,
  JSON_AGG(username ORDER BY created_at) AS usernames_ordered
FROM users
GROUP BY status;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Statistical Functions</h2>

          <CodeBlock
            title="SQL: Statistical Functions"
            language="sql"
            code={`-- Standard deviation and variance
SELECT 
  STDDEV(price) AS price_stddev,
  STDDEV_POP(price) AS price_stddev_pop,
  STDDEV_SAMP(price) AS price_stddev_samp,
  VARIANCE(price) AS price_variance,
  VAR_POP(price) AS price_var_pop,
  VAR_SAMP(price) AS price_var_samp
FROM products;

-- Percentile functions
SELECT 
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median_price,
  PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY price) AS median_price_disc,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price) AS q1_price,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price) AS q3_price
FROM products;

-- Mode (most frequent value)
SELECT MODE() WITHIN GROUP (ORDER BY category_id) AS most_common_category
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Aggregate with FILTER</h2>

          <CodeBlock
            title="SQL: Aggregate with FILTER"
            language="sql"
            code={`-- Conditional aggregation with FILTER
SELECT 
  status,
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE age >= 18) AS adult_users,
  COUNT(*) FILTER (WHERE age < 18) AS minor_users,
  AVG(age) FILTER (WHERE age >= 18) AS avg_adult_age
FROM users
GROUP BY status;

-- Multiple FILTER clauses
SELECT 
  category_id,
  SUM(price) AS total_price,
  SUM(price) FILTER (WHERE stock > 0) AS in_stock_total,
  SUM(price) FILTER (WHERE stock = 0) AS out_of_stock_total,
  COUNT(*) FILTER (WHERE price > 100) AS expensive_count
FROM products
GROUP BY category_id;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Aggregate Functions</h2>

          <CodeBlock
            title="Prisma: Aggregates"
            language="prisma"
            code={`// Basic aggregates
const count = await prisma.user.count();
const countByStatus = await prisma.user.count({
  where: { status: 'active' },
});

// Aggregate with groupBy
const stats = await prisma.user.groupBy({
  by: ['status'],
  _count: {
    id: true,
  },
  _avg: {
    age: true,
  },
});

// Aggregate function
const aggregates = await prisma.product.aggregate({
  _count: { id: true },
  _sum: { price: true },
  _avg: { price: true },
  _min: { price: true },
  _max: { price: true },
});

// Complex aggregates (use raw SQL)
const result = await prisma.$queryRaw\`
  SELECT 
    status,
    COUNT(*) AS total,
    STRING_AGG(username, ', ') AS usernames,
    ARRAY_AGG(id) AS user_ids
  FROM users
  GROUP BY status
\`;

// Statistical functions
const stats = await prisma.$queryRaw\`
  SELECT 
    STDDEV(price) AS stddev,
    VARIANCE(price) AS variance,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median
  FROM products
\`;

// Aggregate with FILTER
const filtered = await prisma.$queryRaw\`
  SELECT 
    status,
    COUNT(*) FILTER (WHERE age >= 18) AS adult_count
  FROM users
  GROUP BY status
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

