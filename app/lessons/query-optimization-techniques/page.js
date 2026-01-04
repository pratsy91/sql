import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Query Optimization Techniques - PostgreSQL Learning',
  description: 'Learn PostgreSQL query optimization techniques including avoiding sequential scans, join optimization, and subquery optimization',
};

export default function QueryOptimizationTechniques() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Query Optimization Techniques</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Avoiding Sequential Scans</h2>

          <CodeBlock
            title="SQL: Avoiding Sequential Scans"
            language="sql"
            code={`-- Sequential scan is expensive on large tables
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
-- May show: Seq Scan on users

-- Add index to avoid sequential scan
CREATE INDEX idx_users_email ON users(email);
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';
-- Should show: Index Scan using idx_users_email

-- Use indexes for WHERE clauses
-- Without index:
EXPLAIN SELECT * FROM orders WHERE user_id = 1;
-- Seq Scan on orders

-- With index:
CREATE INDEX idx_orders_user_id ON orders(user_id);
EXPLAIN SELECT * FROM orders WHERE user_id = 1;
-- Index Scan using idx_orders_user_id

-- Use indexes for ORDER BY
-- Without index:
EXPLAIN SELECT * FROM users ORDER BY created_at DESC;
-- Sort (expensive)

-- With index:
CREATE INDEX idx_users_created_at ON users(created_at DESC);
EXPLAIN SELECT * FROM users ORDER BY created_at DESC;
-- Index Scan using idx_users_created_at (no sort needed)

-- Use indexes for JOINs
-- Without index:
EXPLAIN SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id;
-- May use sequential scan on orders

-- With index:
CREATE INDEX idx_orders_user_id ON orders(user_id);
EXPLAIN SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id;
-- Uses index for join

-- Partial indexes for filtered queries
CREATE INDEX idx_active_users_email 
ON users(email) 
WHERE status = 'active';
-- Smaller index, faster queries for active users only`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Join Optimization</h2>

          <CodeBlock
            title="SQL: Join Optimization"
            language="sql"
            code={`-- Join order matters
-- Smaller table first is often better
EXPLAIN SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id;
-- Planner chooses optimal order

-- Use indexes on join columns
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Nested Loop Join (good for small datasets)
EXPLAIN SELECT u.name, p.bio 
FROM users u 
JOIN profiles p ON u.id = p.user_id;
-- Nested Loop when one table is small

-- Hash Join (good for larger datasets)
EXPLAIN SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id;
-- Hash Join when both tables are large

-- Merge Join (good for sorted data)
EXPLAIN SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id 
ORDER BY u.id;
-- Merge Join when data is sorted

-- Multiple joins optimization
EXPLAIN SELECT u.name, p.bio, o.total 
FROM users u 
JOIN profiles p ON u.id = p.user_id 
JOIN orders o ON u.id = o.user_id;
-- Planner optimizes join order

-- Use WHERE to filter before join
-- Bad: Filter after join
SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.status = 'active';

-- Better: Filter before join (planner usually does this)
SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.status = 'active';
-- Planner filters users first

-- Avoid unnecessary joins
-- Bad: Join when not needed
SELECT u.name 
FROM users u 
JOIN profiles p ON u.id = p.user_id 
WHERE u.status = 'active';

-- Better: No join needed
SELECT name 
FROM users 
WHERE status = 'active';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Subquery Optimization</h2>

          <CodeBlock
            title="SQL: Subquery Optimization"
            language="sql"
            code={`-- Correlated subquery (can be slow)
EXPLAIN SELECT u.name, 
  (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count
FROM users u;
-- Executes subquery for each row

-- Better: Use JOIN with aggregation
EXPLAIN SELECT u.name, COUNT(o.id) as order_count
FROM users u 
LEFT JOIN orders o ON u.id = o.user_id 
GROUP BY u.id, u.name;
-- Single pass through data

-- IN subquery optimization
-- May be converted to join by planner
EXPLAIN SELECT * FROM users 
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);
-- Planner may convert to join

-- EXISTS vs IN
-- EXISTS can be faster (stops on first match)
EXPLAIN SELECT * FROM users u 
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
-- Stops when match found

-- IN with large list
EXPLAIN SELECT * FROM users 
WHERE id IN (1, 2, 3, ..., 10000);
-- May use hash or sort

-- Use CTEs for complex subqueries
WITH user_orders AS (
  SELECT user_id, SUM(total) as total_spent
  FROM orders
  GROUP BY user_id
)
SELECT u.name, uo.total_spent
FROM users u
JOIN user_orders uo ON u.id = uo.user_id;
-- More readable, planner optimizes

-- Lateral joins for correlated subqueries
SELECT u.name, o.total
FROM users u
CROSS JOIN LATERAL (
  SELECT total FROM orders 
  WHERE user_id = u.id 
  ORDER BY created_at DESC 
  LIMIT 1
) o;
-- Efficient for per-row subqueries`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Aggregation Optimization</h2>

          <CodeBlock
            title="SQL: Aggregation Optimization"
            language="sql"
            code={`-- Use indexes for GROUP BY
CREATE INDEX idx_orders_user_id_created ON orders(user_id, created_at);

EXPLAIN SELECT user_id, COUNT(*) 
FROM orders 
GROUP BY user_id;
-- May use index for grouping

-- Filter before aggregation
-- Bad: Aggregate then filter
SELECT user_id, COUNT(*) 
FROM orders 
GROUP BY user_id 
HAVING COUNT(*) > 10;

-- Better: Filter early if possible
SELECT user_id, COUNT(*) 
FROM orders 
WHERE created_at > '2024-01-01'
GROUP BY user_id 
HAVING COUNT(*) > 10;

-- Use DISTINCT efficiently
-- May use index if available
EXPLAIN SELECT DISTINCT status FROM users;
-- May use index scan

-- Avoid unnecessary DISTINCT
-- Bad: DISTINCT when not needed
SELECT DISTINCT u.id, u.name 
FROM users u 
WHERE u.id = 1;

-- Better: No DISTINCT needed
SELECT u.id, u.name 
FROM users u 
WHERE u.id = 1;

-- Optimize COUNT(*)
-- COUNT(*) is optimized
EXPLAIN SELECT COUNT(*) FROM users;
-- Fast aggregate

-- COUNT(column) is slower (checks NULLs)
EXPLAIN SELECT COUNT(email) FROM users;
-- Slower than COUNT(*)

-- Use approximate count for large tables
SELECT reltuples::bigint AS approximate_count
FROM pg_class
WHERE relname = 'users';
-- Very fast, approximate`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">LIMIT and OFFSET Optimization</h2>

          <CodeBlock
            title="SQL: LIMIT Optimization"
            language="sql"
            code={`-- LIMIT stops early (good for performance)
EXPLAIN SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
-- Stops after 10 rows

-- Use index for ORDER BY + LIMIT
CREATE INDEX idx_users_created_at ON users(created_at DESC);
EXPLAIN SELECT * FROM users ORDER BY created_at DESC LIMIT 10;
-- Index scan, very fast

-- OFFSET can be expensive
EXPLAIN SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 1000;
-- Must skip 1000 rows

-- Better: Use cursor-based pagination
-- Instead of OFFSET, use WHERE id > last_id
SELECT * FROM users 
WHERE id > 1000 
ORDER BY id 
LIMIT 10;
-- Much faster

-- Avoid large OFFSET
-- Bad: Large OFFSET
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 1000000;
-- Very slow

-- Better: Use indexed WHERE
SELECT * FROM users 
WHERE id > 1000000 
ORDER BY id 
LIMIT 10;
-- Fast with index`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Query Optimization</h2>

          <CodeBlock
            title="Prisma: Optimizing Queries"
            language="prisma"
            code={`// Use select to limit columns
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
    // Only fetch needed columns
  }
});

// Use where to filter early
const activeUsers = await prisma.user.findMany({
  where: {
    status: 'active'
  }
});

// Use indexes in where clauses
const user = await prisma.user.findUnique({
  where: {
    email: 'test@example.com'  // Uses unique index
  }
});

// Optimize includes
const usersWithOrders = await prisma.user.findMany({
  include: {
    orders: {
      where: {
        status: 'completed'  // Filter related data
      },
      take: 10  // Limit related data
    }
  }
});

// Use take instead of large offsets
const users = await prisma.user.findMany({
  take: 10,
  skip: 0,  // Avoid large skip values
  orderBy: {
    id: 'asc'
  }
});

// Better: Cursor-based pagination
const users = await prisma.user.findMany({
  take: 10,
  cursor: {
    id: lastId
  },
  orderBy: {
    id: 'asc'
  }
});

// Use raw SQL for complex queries
const result = await prisma.$queryRaw\`
  SELECT 
    u.id,
    u.name,
    COUNT(o.id) as order_count
  FROM "User" u
  LEFT JOIN "Order" o ON u.id = o.user_id
  WHERE u.status = 'active'
  GROUP BY u.id, u.name
  HAVING COUNT(o.id) > 5
\`;

// Analyze Prisma queries
const plan = await prisma.$queryRaw\`
  EXPLAIN (ANALYZE, BUFFERS)
  SELECT * FROM "User" WHERE email = $1
\`, 'test@example.com';

// Use transactions for multiple operations
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: {...} });
  await tx.profile.create({ data: { userId: user.id, ...} });
  return user;
});`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Add indexes</strong> for WHERE, JOIN, and ORDER BY clauses</li>
              <li><strong>Filter early</strong> - use WHERE before JOINs when possible</li>
              <li><strong>Use JOINs instead of subqueries</strong> when possible</li>
              <li><strong>Avoid large OFFSET</strong> - use cursor-based pagination</li>
              <li><strong>Select only needed columns</strong> - avoid SELECT *</li>
              <li><strong>Use LIMIT</strong> to stop early when possible</li>
              <li><strong>Analyze query plans</strong> to identify bottlenecks</li>
              <li><strong>Keep statistics updated</strong> with ANALYZE</li>
              <li><strong>Test with realistic data</strong> - plans change with data</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

