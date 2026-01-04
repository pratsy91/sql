import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Aggregate Functions (Detailed) - PostgreSQL Learning',
  description: 'Comprehensive coverage of all PostgreSQL aggregate functions including custom aggregates',
};

export default function AggregateFunctionsDetailed() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Aggregate Functions (Detailed)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">All Aggregate Functions</h2>
          <p className="mb-4">
            PostgreSQL provides a comprehensive set of aggregate functions for data analysis.
          </p>

          <CodeBlock
            title="SQL: Basic Aggregate Functions"
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
SELECT AVG(DISTINCT price) FROM products;

-- MIN and MAX
SELECT MIN(price), MAX(price) FROM products;
SELECT MIN(created_at), MAX(created_at) FROM users;

-- BOOL_AND, BOOL_OR
SELECT BOOL_AND(is_active) FROM users;
SELECT BOOL_OR(is_verified) FROM users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Statistical Aggregate Functions</h2>

          <CodeBlock
            title="SQL: Statistical Functions"
            language="sql"
            code={`-- Standard deviation
SELECT STDDEV(price) AS stddev FROM products;
SELECT STDDEV_POP(price) AS stddev_pop FROM products;
SELECT STDDEV_SAMP(price) AS stddev_samp FROM products;

-- Variance
SELECT VARIANCE(price) AS variance FROM products;
SELECT VAR_POP(price) AS var_pop FROM products;
SELECT VAR_SAMP(price) AS var_samp FROM products;

-- Percentiles
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median FROM products;
SELECT PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY price) AS median_disc FROM products;
SELECT PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price) AS q1 FROM products;
SELECT PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price) AS q3 FROM products;

-- Mode (most frequent value)
SELECT MODE() WITHIN GROUP (ORDER BY category_id) AS most_common_category FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">String and Array Aggregates</h2>

          <CodeBlock
            title="SQL: String and Array Aggregates"
            language="sql"
            code={`-- STRING_AGG
SELECT STRING_AGG(username, ', ') FROM users;
SELECT status, STRING_AGG(username, ', ' ORDER BY username) FROM users GROUP BY status;

-- ARRAY_AGG
SELECT ARRAY_AGG(username) FROM users;
SELECT category_id, ARRAY_AGG(name ORDER BY name) FROM products GROUP BY category_id;

-- JSON_AGG, JSONB_AGG
SELECT JSON_AGG(username) FROM users;
SELECT JSONB_AGG(ROW(id, username, email)) FROM users;
SELECT category_id, JSONB_AGG(JSONB_BUILD_OBJECT('id', id, 'name', name)) FROM products GROUP BY category_id;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Custom Aggregate Functions</h2>

          <CodeBlock
            title="SQL: Custom Aggregates"
            language="sql"
            code={`-- Create custom aggregate
CREATE AGGREGATE custom_sum(numeric) (
  SFUNC = numeric_add,
  STYPE = numeric,
  INITCOND = '0'
);

-- Use custom aggregate
SELECT custom_sum(price) FROM products;

-- Custom aggregate with multiple parameters
CREATE AGGREGATE weighted_avg(numeric, numeric) (
  SFUNC = numeric_mul,
  STYPE = numeric,
  FINALFUNC = numeric_div,
  INITCOND = '0'
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Aggregate Functions</h2>

          <CodeBlock
            title="Prisma: Aggregates"
            language="prisma"
            code={`// Basic aggregates
const count = await prisma.user.count();
const aggregates = await prisma.product.aggregate({
  _count: { id: true },
  _sum: { price: true },
  _avg: { price: true },
  _min: { price: true },
  _max: { price: true },
});

// Group by with aggregates
const stats = await prisma.user.groupBy({
  by: ['status'],
  _count: { id: true },
  _avg: { age: true },
});

// Complex aggregates (use raw SQL)
const result = await prisma.$queryRaw\`
  SELECT 
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median,
    STDDEV(price) AS stddev
  FROM products
\`;`}
          />
        </section>
      </div>
    </LessonLayout>
  );
}

