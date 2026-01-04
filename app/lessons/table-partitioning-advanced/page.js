import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Table Partitioning (Advanced) - PostgreSQL Learning',
  description: 'Learn advanced PostgreSQL table partitioning including all partitioning strategies and partition management',
};

export default function TablePartitioningAdvanced() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Table Partitioning (Advanced)</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">All Partitioning Strategies</h2>

          <CodeBlock
            title="SQL: Range Partitioning"
            language="sql"
            code={`-- Range partitioning by date
CREATE TABLE orders (
  id SERIAL,
  user_id INTEGER,
  total NUMERIC,
  created_at DATE
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE orders_2024_q1 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
  FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Range partitioning by integer
CREATE TABLE events (
  id SERIAL,
  event_type TEXT,
  timestamp TIMESTAMP
) PARTITION BY RANGE (id);

CREATE TABLE events_1_1000 PARTITION OF events
  FOR VALUES FROM (1) TO (1000);

CREATE TABLE events_1000_2000 PARTITION OF events
  FOR VALUES FROM (1000) TO (2000);

-- Range partitioning with multiple columns
CREATE TABLE sensor_data (
  id SERIAL,
  sensor_id INTEGER,
  timestamp TIMESTAMP,
  value NUMERIC
) PARTITION BY RANGE (sensor_id, timestamp);

CREATE TABLE sensor_data_1 PARTITION OF sensor_data
  FOR VALUES FROM (1, MINVALUE) TO (1, MAXVALUE);

-- Default partition (catches values outside defined ranges)
CREATE TABLE orders_default PARTITION OF orders DEFAULT;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">List and Hash Partitioning</h2>

          <CodeBlock
            title="SQL: List and Hash Partitioning"
            language="sql"
            code={`-- List partitioning
CREATE TABLE users (
  id SERIAL,
  name TEXT,
  country TEXT
) PARTITION BY LIST (country);

CREATE TABLE users_usa PARTITION OF users
  FOR VALUES IN ('US', 'USA');

CREATE TABLE users_europe PARTITION OF users
  FOR VALUES IN ('UK', 'FR', 'DE', 'IT', 'ES');

CREATE TABLE users_asia PARTITION OF users
  FOR VALUES IN ('JP', 'CN', 'IN', 'KR');

-- List partitioning with multiple columns
CREATE TABLE products (
  id SERIAL,
  category TEXT,
  status TEXT
) PARTITION BY LIST (category, status);

CREATE TABLE products_electronics_active PARTITION OF products
  FOR VALUES IN (('electronics', 'active'));

-- Hash partitioning
CREATE TABLE sessions (
  id SERIAL,
  user_id INTEGER,
  data JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE sessions_0 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE sessions_1 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE sessions_2 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE sessions_3 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Hash partitioning evenly distributes data
-- Good for load balancing across partitions`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Composite Partitioning</h2>

          <CodeBlock
            title="SQL: Composite Partitioning"
            language="sql"
            code={`-- Composite partitioning (sub-partitioning)
-- First level: range by date
CREATE TABLE orders (
  id SERIAL,
  user_id INTEGER,
  total NUMERIC,
  created_at DATE,
  status TEXT
) PARTITION BY RANGE (created_at);

-- Second level: list by status
CREATE TABLE orders_2024_q1 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01')
  PARTITION BY LIST (status);

-- Sub-partitions
CREATE TABLE orders_2024_q1_completed PARTITION OF orders_2024_q1
  FOR VALUES IN ('completed');

CREATE TABLE orders_2024_q1_pending PARTITION OF orders_2024_q1
  FOR VALUES IN ('pending', 'processing');

CREATE TABLE orders_2024_q1_cancelled PARTITION OF orders_2024_q1
  FOR VALUES IN ('cancelled');

-- Three-level partitioning
CREATE TABLE events (
  id SERIAL,
  event_type TEXT,
  created_at DATE,
  region TEXT
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')
  PARTITION BY LIST (event_type);

CREATE TABLE events_2024_login PARTITION OF events_2024
  FOR VALUES IN ('login')
  PARTITION BY LIST (region);

CREATE TABLE events_2024_login_us PARTITION OF events_2024_login
  FOR VALUES IN ('US');

CREATE TABLE events_2024_login_eu PARTITION OF events_2024_login
  FOR VALUES IN ('EU');`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Partition Management</h2>

          <CodeBlock
            title="SQL: Managing Partitions"
            language="sql"
            code={`-- Add new partition
CREATE TABLE orders_2025_q1 PARTITION OF orders
  FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');

-- Detach partition (make it standalone table)
ALTER TABLE orders DETACH PARTITION orders_2024_q1;

-- Attach existing table as partition
CREATE TABLE orders_old (
  LIKE orders INCLUDING ALL
);

-- Populate orders_old with data
-- Then attach:
ALTER TABLE orders ATTACH PARTITION orders_old
  FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

-- Drop partition
DROP TABLE orders_2024_q1;

-- Truncate partition
TRUNCATE TABLE orders_2024_q1;

-- Add column to partitioned table (applies to all partitions)
ALTER TABLE orders ADD COLUMN notes TEXT;

-- Add column to specific partition
ALTER TABLE orders_2024_q1 ADD COLUMN temp_field TEXT;

-- Create index on partitioned table (applies to all partitions)
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Create index on specific partition
CREATE INDEX idx_orders_2024_q1_total ON orders_2024_q1(total);

-- VACUUM partition
VACUUM ANALYZE orders_2024_q1;

-- View partition information
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'orders%';

-- View partition constraints
SELECT 
  conname,
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'orders'::regclass;

-- View partition hierarchy
SELECT 
  n.nspname AS schema,
  c.relname AS partition,
  pg_get_expr(c.relpartbound, c.oid) AS partition_expression
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relispartition = true
  AND c.relkind = 'r'
ORDER BY n.nspname, c.relname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Partition Pruning</h2>

          <CodeBlock
            title="SQL: Partition Pruning Optimization"
            language="sql"
            code={`-- Partition pruning (automatic optimization)
-- Only relevant partitions are queried

-- Range partition pruning
EXPLAIN SELECT * FROM orders 
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31';
-- Only queries orders_2024_q1

-- List partition pruning
EXPLAIN SELECT * FROM users WHERE country = 'US';
-- Only queries users_usa

-- Hash partition pruning
EXPLAIN SELECT * FROM sessions WHERE user_id = 5;
-- Only queries relevant hash partition

-- Pruning with JOINs
EXPLAIN SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= '2024-01-01';
-- Prunes orders partitions

-- Pruning with subqueries
EXPLAIN SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders 
  WHERE created_at >= '2024-01-01'
);
-- May prune orders partitions

-- Check if pruning is working
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders 
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31';
-- Should show: Append -> Seq Scan on orders_2024_q1 only

-- Pruning may not work with:
-- - Functions on partition key
-- - Complex expressions
-- - Some JOIN conditions

-- Force pruning with constraint_exclusion
SET constraint_exclusion = partition;
-- Options: off, on, partition`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Advanced Partitioning</h2>

          <CodeBlock
            title="Prisma: Partition Management"
            language="prisma"
            code={`// Prisma doesn't have native partitioning support
// Use raw SQL for partition operations

// Create partitioned table
await prisma.$executeRaw\`
  CREATE TABLE orders (
    id SERIAL,
    user_id INTEGER,
    total NUMERIC,
    created_at DATE
  ) PARTITION BY RANGE (created_at)
\`;

// Create partitions
await prisma.$executeRaw\`
  CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01')
\`;

// Add new partition
await prisma.$executeRaw\`
  CREATE TABLE orders_2025_q1 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01')
\`;

// Detach partition
await prisma.$executeRaw\`
  ALTER TABLE orders DETACH PARTITION orders_2024_q1
\`;

// View partitions
const partitions = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename
  FROM pg_tables
  WHERE tablename LIKE 'orders_%'
  ORDER BY tablename
\`;

// View partition hierarchy
const hierarchy = await prisma.$queryRaw\`
  SELECT 
    n.nspname AS schema,
    c.relname AS partition,
    pg_get_expr(c.relpartbound, c.oid) AS partition_expression
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relispartition = true
    AND c.relkind = 'r'
  ORDER BY c.relname
\`;

// Query partitioned table (works normally)
const orders = await prisma.$queryRaw\`
  SELECT * FROM orders 
  WHERE created_at BETWEEN $1 AND $2
\`, '2024-01-01', '2024-03-31';

// Check partition pruning
const plan = await prisma.$queryRaw\`
  EXPLAIN SELECT * FROM orders 
  WHERE created_at BETWEEN $1 AND $2
\`, '2024-01-01', '2024-03-31';

// Note: Prisma queries work normally on partitioned tables
// Partition pruning happens automatically`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Choose appropriate strategy</strong> - range for time-series, list for categories</li>
              <li><strong>Keep partition size manageable</strong> - not too small or too large</li>
              <li><strong>Plan partition strategy</strong> - before creating table</li>
              <li><strong>Use partition pruning</strong> - design queries to enable it</li>
              <li><strong>Create indexes</strong> - on partitioned tables (applies to all partitions)</li>
              <li><strong>Monitor partition sizes</strong> - add new partitions as needed</li>
              <li><strong>Archive old partitions</strong> - detach and move to archive</li>
              <li><strong>Test partition pruning</strong> - verify queries use correct partitions</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

