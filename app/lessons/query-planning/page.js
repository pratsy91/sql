import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Query Planning - PostgreSQL Learning',
  description: 'Learn about PostgreSQL query planning including EXPLAIN, EXPLAIN ANALYZE, and understanding query plans',
};

export default function QueryPlanning() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Query Planning</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Query Planning?</h2>
          <p className="mb-4">
            PostgreSQL's query planner determines the most efficient way to execute a query. 
            It considers available indexes, table statistics, and various execution strategies 
            to create an optimal query plan.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">EXPLAIN</h2>

          <CodeBlock
            title="SQL: Basic EXPLAIN"
            language="sql"
            code={`-- Basic EXPLAIN (shows query plan without executing)
EXPLAIN SELECT * FROM users WHERE id = 1;

-- EXPLAIN with format options
EXPLAIN (FORMAT TEXT) SELECT * FROM users WHERE id = 1;
EXPLAIN (FORMAT XML) SELECT * FROM users WHERE id = 1;
EXPLAIN (FORMAT JSON) SELECT * FROM users WHERE id = 1;
EXPLAIN (FORMAT YAML) SELECT * FROM users WHERE id = 1;

-- EXPLAIN with verbose output
EXPLAIN (VERBOSE) SELECT * FROM users WHERE id = 1;

-- EXPLAIN with costs
EXPLAIN (COSTS) SELECT * FROM users WHERE id = 1;
-- Costs show estimated execution cost

-- EXPLAIN without costs
EXPLAIN (COSTS FALSE) SELECT * FROM users WHERE id = 1;

-- EXPLAIN with buffer usage
EXPLAIN (BUFFERS) SELECT * FROM users WHERE id = 1;
-- Shows buffer usage (requires ANALYZE)

-- EXPLAIN with timing
EXPLAIN (TIMING) SELECT * FROM users WHERE id = 1;
-- Shows timing information (requires ANALYZE)

-- EXPLAIN with settings
EXPLAIN (SETTINGS) SELECT * FROM users WHERE id = 1;
-- Shows configuration settings affecting the plan

-- Combined options
EXPLAIN (FORMAT JSON, VERBOSE, COSTS, BUFFERS, TIMING, SETTINGS)
SELECT * FROM users WHERE id = 1;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">EXPLAIN ANALYZE</h2>

          <CodeBlock
            title="SQL: EXPLAIN ANALYZE"
            language="sql"
            code={`-- EXPLAIN ANALYZE (executes query and shows actual performance)
EXPLAIN ANALYZE SELECT * FROM users WHERE id = 1;

-- Shows both estimated and actual costs
-- Actual execution time
-- Actual rows returned
-- Actual loops

-- EXPLAIN ANALYZE with format
EXPLAIN (ANALYZE, FORMAT JSON) 
SELECT * FROM users WHERE id = 1;

-- EXPLAIN ANALYZE with buffers
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE id = 1;
-- Shows actual buffer hits/reads

-- Compare estimated vs actual
EXPLAIN (ANALYZE, VERBOSE) 
SELECT * FROM users WHERE email = 'test@example.com';

-- Example output interpretation:
-- Seq Scan on users (cost=0.00..25.00 rows=1 width=64) 
--   (actual time=0.123..0.123 rows=1 loops=1)
--   Filter: (email = 'test@example.com'::text)
--   Rows Removed by Filter: 999
-- Planning Time: 0.045 ms
-- Execution Time: 0.156 ms`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Understanding Query Plans</h2>

          <CodeBlock
            title="SQL: Query Plan Components"
            language="sql"
            code={`-- Sequential Scan
EXPLAIN SELECT * FROM users;
-- Seq Scan on users (cost=0.00..25.00 rows=1000 width=64)

-- Index Scan
EXPLAIN SELECT * FROM users WHERE id = 1;
-- Index Scan using users_pkey on users (cost=0.29..8.30 rows=1 width=64)

-- Index Only Scan
EXPLAIN SELECT id FROM users WHERE id < 100;
-- Index Only Scan using users_pkey on users (cost=0.29..4.48 rows=99 width=4)

-- Bitmap Index Scan + Bitmap Heap Scan
EXPLAIN SELECT * FROM users WHERE status = 'active';
-- Bitmap Heap Scan on users (cost=4.34..15.04 rows=100 width=64)
--   -> Bitmap Index Scan on idx_users_status (cost=0.00..4.31 rows=100 width=0)

-- Nested Loop Join
EXPLAIN SELECT u.name, p.bio 
FROM users u 
JOIN profiles p ON u.id = p.user_id;
-- Nested Loop (cost=0.57..25.45 rows=100 width=64)
--   -> Seq Scan on users u (cost=0.00..15.00 rows=100 width=32)
--   -> Index Scan using profiles_user_id_idx on profiles p (cost=0.29..0.35 rows=1 width=32)

-- Hash Join
EXPLAIN SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id;
-- Hash Join (cost=15.00..45.00 rows=500 width=64)
--   Hash Cond: (o.user_id = u.id)
--   -> Seq Scan on orders o (cost=0.00..20.00 rows=500 width=32)
--   -> Hash (cost=15.00..15.00 rows=100 width=32)
--       -> Seq Scan on users u (cost=0.00..15.00 rows=100 width=32)

-- Merge Join
EXPLAIN SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id 
ORDER BY u.id;
-- Merge Join (cost=20.00..50.00 rows=500 width=64)
--   Merge Cond: (u.id = o.user_id)
--   -> Index Scan using users_pkey on users u (cost=0.29..8.30 rows=100 width=32)
--   -> Index Scan using orders_user_id_idx on orders o (cost=0.29..25.00 rows=500 width=32)

-- Sort
EXPLAIN SELECT * FROM users ORDER BY name;
-- Sort (cost=22.50..23.00 rows=100 width=64)
--   Sort Key: name
--   -> Seq Scan on users (cost=0.00..15.00 rows=100 width=64)

-- Aggregate
EXPLAIN SELECT COUNT(*) FROM users;
-- Aggregate (cost=15.00..15.01 rows=1 width=8)
--   -> Seq Scan on users (cost=0.00..15.00 rows=100 width=0)`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Plan Analysis</h2>

          <CodeBlock
            title="SQL: Analyzing Query Plans"
            language="sql"
            code={`-- Identify expensive operations
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC;

-- Look for:
-- 1. High cost estimates
-- 2. Large row estimates vs actual
-- 3. Sequential scans on large tables
-- 4. Missing indexes
-- 5. Expensive sorts or joins

-- Compare plans
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM users WHERE email = 'test@example.com';
-- Without index: Seq Scan
-- With index: Index Scan

-- Check for filter conditions
EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM users WHERE status = 'active' AND age > 18;
-- Look for "Rows Removed by Filter" - indicates inefficient filtering

-- Analyze join performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT u.name, p.bio, o.total
FROM users u
JOIN profiles p ON u.id = p.user_id
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active';

-- Check for:
-- - Join type (Nested Loop vs Hash vs Merge)
-- - Join order
-- - Index usage in joins

-- Subquery analysis
EXPLAIN (ANALYZE, VERBOSE)
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);
-- May show SubPlan or Materialize operations`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Query Planning</h2>

          <CodeBlock
            title="Prisma: Using EXPLAIN with Prisma"
            language="prisma"
            code={`// Prisma doesn't have built-in EXPLAIN
// Use raw SQL to analyze queries

// Explain a Prisma-generated query
const explainResult = await prisma.$queryRaw\`
  EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
  SELECT * FROM users WHERE id = 1
\`;

// Explain complex Prisma query
const complexExplain = await prisma.$queryRaw\`
  EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
  SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as order_count
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE u.status = 'active'
  GROUP BY u.id, u.name, u.email
  HAVING COUNT(o.id) > 5
\`;

// Analyze Prisma findMany query
const findManyExplain = await prisma.$queryRaw\`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT "User"."id", "User"."name", "User"."email"
  FROM "User"
  WHERE "User"."status" = $1
\`, 'active';

// Compare query plans
// 1. Get the actual SQL from Prisma
const users = await prisma.user.findMany({
  where: { status: 'active' },
  include: { orders: true }
});

// 2. Explain the equivalent SQL
const plan = await prisma.$queryRaw\`
  EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
  SELECT 
    u.*,
    json_agg(o.*) as orders
  FROM "User" u
  LEFT JOIN "Order" o ON u.id = o.user_id
  WHERE u.status = 'active'
  GROUP BY u.id
\`;

// Monitor query performance
const slowQueries = await prisma.$queryRaw\`
  SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
  FROM pg_stat_statements
  WHERE mean_exec_time > 100
  ORDER BY mean_exec_time DESC
  LIMIT 10
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use EXPLAIN ANALYZE</strong> to see actual performance</li>
              <li><strong>Compare estimated vs actual</strong> rows to identify statistics issues</li>
              <li><strong>Look for sequential scans</strong> on large tables - may need indexes</li>
              <li><strong>Check join types</strong> - nested loops can be slow for large datasets</li>
              <li><strong>Monitor buffer usage</strong> to identify I/O bottlenecks</li>
              <li><strong>Use VERBOSE</strong> for detailed plan information</li>
              <li><strong>Analyze filter conditions</strong> - high "Rows Removed by Filter" is inefficient</li>
              <li><strong>Test with realistic data</strong> - plans change with data distribution</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

