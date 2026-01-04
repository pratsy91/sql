import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Advanced Aggregation - PostgreSQL Learning',
  description: 'Learn about advanced PostgreSQL aggregation including custom aggregate functions, ordered-set aggregates, and hypothetical-set aggregates',
};

export default function AdvancedAggregation() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Advanced Aggregation</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Custom Aggregate Functions</h2>

          <CodeBlock
            title="SQL: Creating Custom Aggregates"
            language="sql"
            code={`-- Simple custom aggregate
CREATE AGGREGATE my_sum(INTEGER) (
  SFUNC = int4pl,  -- State function
  STYPE = INTEGER,  -- State type
  INITCOND = '0'    -- Initial condition
);

-- Use custom aggregate
SELECT my_sum(value) FROM numbers;

-- Custom aggregate with multiple parameters
CREATE AGGREGATE weighted_avg(
  base NUMERIC,
  weight NUMERIC
) (
  SFUNC = weighted_avg_accum,
  STYPE = NUMERIC[],
  FINALFUNC = weighted_avg_final,
  INITCOND = '{0,0}'
);

-- Aggregate with state function
CREATE OR REPLACE FUNCTION sum_state(state INTEGER, value INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN state + value;
END;
$$;

CREATE AGGREGATE my_sum(INTEGER) (
  SFUNC = sum_state,
  STYPE = INTEGER,
  INITCOND = '0'
);

-- Aggregate with final function
CREATE OR REPLACE FUNCTION array_accum_state(state INTEGER[], value INTEGER)
RETURNS INTEGER[]
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN array_append(state, value);
END;
$$;

CREATE OR REPLACE FUNCTION array_accum_final(state INTEGER[])
RETURNS INTEGER[]
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN state;
END;
$$;

CREATE AGGREGATE array_accum(INTEGER) (
  SFUNC = array_accum_state,
  STYPE = INTEGER[],
  FINALFUNC = array_accum_final,
  INITCOND = '{}'
);

-- Use aggregate
SELECT array_accum(id) FROM users;

-- Aggregate with moving window
CREATE AGGREGATE moving_avg(DOUBLE PRECISION) (
  SFUNC = float8_accum,
  STYPE = FLOAT8[],
  FINALFUNC = float8_avg,
  INITCOND = '{0,0,0}'
);`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ordered-Set Aggregates</h2>

          <CodeBlock
            title="SQL: Ordered-Set Aggregates"
            language="sql"
            code={`-- Ordered-set aggregates require ORDER BY

-- percentile_cont (continuous percentile)
SELECT 
  percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median_price
FROM products;

-- Multiple percentiles
SELECT 
  percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY price) AS quartiles
FROM products;

-- percentile_disc (discrete percentile)
SELECT 
  percentile_disc(0.5) WITHIN GROUP (ORDER BY price) AS median_price
FROM products;

-- mode (most frequent value)
SELECT 
  mode() WITHIN GROUP (ORDER BY category) AS most_common_category
FROM products;

-- Use with GROUP BY
SELECT 
  category,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median_price
FROM products
GROUP BY category;

-- percentile_cont vs percentile_disc
-- percentile_cont: Interpolates between values
-- percentile_disc: Returns actual value from dataset

-- Example:
-- Values: 1, 2, 3, 4, 5
-- percentile_cont(0.5) = 3.0 (interpolated)
-- percentile_disc(0.5) = 3 (actual value)

-- Percentile with different data types
SELECT 
  percentile_cont(0.5) WITHIN GROUP (ORDER BY created_at) AS median_date
FROM orders;

-- Multiple ordered-set aggregates
SELECT 
  percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median,
  percentile_cont(0.9) WITHIN GROUP (ORDER BY price) AS p90,
  mode() WITHIN GROUP (ORDER BY category) AS mode_category
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Hypothetical-Set Aggregates</h2>

          <CodeBlock
            title="SQL: Hypothetical-Set Aggregates"
            language="sql"
            code={`-- Hypothetical-set aggregates use hypothetical value

-- rank (hypothetical)
SELECT 
  rank(1000) WITHIN GROUP (ORDER BY price DESC) AS hypothetical_rank
FROM products;
-- Returns rank of value 1000 if inserted into ordered set

-- percent_rank (hypothetical)
SELECT 
  percent_rank(1000) WITHIN GROUP (ORDER BY price) AS hypothetical_percent_rank
FROM products;
-- Returns percentile rank of hypothetical value

-- cume_dist (hypothetical)
SELECT 
  cume_dist(1000) WITHIN GROUP (ORDER BY price) AS hypothetical_cume_dist
FROM products;
-- Returns cumulative distribution of hypothetical value

-- dense_rank (hypothetical)
SELECT 
  dense_rank(1000) WITHIN GROUP (ORDER BY price DESC) AS hypothetical_dense_rank
FROM products;

-- Use case: Find where a value would rank
SELECT 
  rank(500) WITHIN GROUP (ORDER BY price DESC) AS rank_if_500
FROM products;
-- Returns: "If price was 500, what rank would it have?"

-- Compare with actual rank
SELECT 
  price,
  rank() OVER (ORDER BY price DESC) AS actual_rank,
  rank(price) WITHIN GROUP (ORDER BY price DESC) AS hypothetical_rank
FROM products
ORDER BY price DESC;

-- Use with GROUP BY
SELECT 
  category,
  rank(100) WITHIN GROUP (ORDER BY price DESC) AS rank_if_100
FROM products
GROUP BY category;

-- Multiple hypothetical values
SELECT 
  rank(500) WITHIN GROUP (ORDER BY price DESC) AS rank_500,
  rank(1000) WITHIN GROUP (ORDER BY price DESC) AS rank_1000,
  rank(2000) WITHIN GROUP (ORDER BY price DESC) AS rank_2000
FROM products;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Aggregate Options</h2>

          <CodeBlock
            title="SQL: Aggregate Function Options"
            language="sql"
            code={`-- Aggregate with COMBINEFUNC (for parallel aggregation)
CREATE AGGREGATE parallel_sum(INTEGER) (
  SFUNC = int4pl,
  STYPE = INTEGER,
  COMBINEFUNC = int4pl,
  INITCOND = '0'
);

-- Aggregate with SERIALFUNC (for serialization)
CREATE AGGREGATE serializable_sum(INTEGER) (
  SFUNC = int4pl,
  STYPE = INTEGER,
  SERIALFUNC = int4send,
  DESERIALFUNC = int4recv,
  INITCOND = '0'
);

-- Aggregate with MSFUNC (moving state function)
CREATE AGGREGATE moving_avg(DOUBLE PRECISION) (
  SFUNC = float8_accum,
  STYPE = FLOAT8[],
  FINALFUNC = float8_avg,
  MSFUNC = float8_accum_inv,
  MINVFUNC = float8_accum_inv,
  INITCOND = '{0,0,0}'
);

-- Aggregate with SORTOP (sort operator)
CREATE AGGREGATE my_max(INTEGER) (
  SFUNC = int4larger,
  STYPE = INTEGER,
  SORTOP = >,
  INITCOND = '-2147483648'
);

-- View aggregate definitions
SELECT 
  proname,
  proargtypes::regtype[],
  prosrc
FROM pg_proc
WHERE proname LIKE '%_agg'
   OR proname LIKE '%_accum';

-- View aggregate information
SELECT 
  aggfnoid::regprocedure AS aggregate,
  aggnumdirectargs,
  aggkind,
  aggtranstype::regtype AS state_type
FROM pg_aggregate
JOIN pg_proc ON aggfnoid = oid
WHERE proname = 'my_sum';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Statistical Aggregates</h2>

          <CodeBlock
            title="SQL: Statistical Aggregate Functions"
            language="sql"
            code={`-- Standard statistical aggregates
SELECT 
  COUNT(*) AS count,
  SUM(price) AS total,
  AVG(price) AS average,
  MIN(price) AS minimum,
  MAX(price) AS maximum,
  STDDEV(price) AS std_dev,
  VARIANCE(price) AS variance
FROM products;

-- Population vs sample statistics
SELECT 
  STDDEV_POP(price) AS pop_stddev,
  STDDEV_SAMP(price) AS samp_stddev,
  VAR_POP(price) AS pop_variance,
  VAR_SAMP(price) AS samp_variance
FROM products;

-- Correlation
SELECT 
  CORR(price, quantity) AS price_quantity_correlation
FROM products;

-- Regression functions
SELECT 
  REGR_SLOPE(price, quantity) AS slope,
  REGR_INTERCEPT(price, quantity) AS intercept,
  REGR_R2(price, quantity) AS r_squared
FROM products;

-- Covariance
SELECT 
  COVAR_POP(price, quantity) AS pop_covariance,
  COVAR_SAMP(price, quantity) AS samp_covariance
FROM products;

-- Use with GROUP BY
SELECT 
  category,
  AVG(price) AS avg_price,
  STDDEV(price) AS stddev_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) AS median_price
FROM products
GROUP BY category;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Advanced Aggregation</h2>

          <CodeBlock
            title="Prisma: Advanced Aggregation"
            language="prisma"
            code={`// Prisma has limited aggregation support
// Use raw SQL for advanced aggregation

// Custom aggregate
await prisma.$executeRaw\`
  CREATE AGGREGATE IF NOT EXISTS my_sum(INTEGER) (
    SFUNC = int4pl,
    STYPE = INTEGER,
    INITCOND = '0'
  )
\`;

// Use custom aggregate
const result = await prisma.$queryRaw\`
  SELECT my_sum(value) AS total
  FROM numbers
\`;

// Ordered-set aggregates
const median = await prisma.$queryRaw\`
  SELECT 
    percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median_price
  FROM products
\`;

const quartiles = await prisma.$queryRaw\`
  SELECT 
    percentile_cont(ARRAY[0.25, 0.5, 0.75]) WITHIN GROUP (ORDER BY price) AS quartiles
  FROM products
\`;

const mode = await prisma.$queryRaw\`
  SELECT 
    mode() WITHIN GROUP (ORDER BY category) AS most_common_category
  FROM products
\`;

// Hypothetical-set aggregates
const hypotheticalRank = await prisma.$queryRaw\`
  SELECT 
    rank($1) WITHIN GROUP (ORDER BY price DESC) AS hypothetical_rank
  FROM products
\`, 1000;

// Statistical aggregates
const stats = await prisma.$queryRaw\`
  SELECT 
    AVG(price) AS avg_price,
    STDDEV(price) AS stddev_price,
    CORR(price, quantity) AS correlation
  FROM products
\`;

// Grouped aggregation
const categoryStats = await prisma.$queryRaw\`
  SELECT 
    category,
    AVG(price) AS avg_price,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median_price
  FROM products
  GROUP BY category
\`;

// Prisma built-in aggregation (limited)
const count = await prisma.product.count();
const avg = await prisma.product.aggregate({
  _avg: { price: true }
});

// For advanced aggregation, use raw SQL`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use ordered-set aggregates</strong> - for percentiles and mode</li>
              <li><strong>Use hypothetical-set aggregates</strong> - to find hypothetical ranks</li>
              <li><strong>Create custom aggregates</strong> - for domain-specific calculations</li>
              <li><strong>Use appropriate statistics</strong> - population vs sample</li>
              <li><strong>Test aggregate functions</strong> - verify correctness</li>
              <li><strong>Document custom aggregates</strong> - explain purpose and usage</li>
              <li><strong>Consider performance</strong> - some aggregates can be expensive</li>
              <li><strong>Use with GROUP BY</strong> - for grouped aggregations</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

