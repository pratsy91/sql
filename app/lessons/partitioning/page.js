import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Partitioning - PostgreSQL Learning',
  description: 'Learn about PostgreSQL table partitioning including range, list, hash, and composite partitioning',
};

export default function Partitioning() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Partitioning</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is Partitioning?</h2>
          <p className="mb-4">
            Partitioning splits a large table into smaller, more manageable pieces called partitions. 
            This improves query performance, maintenance, and allows for better data management. 
            PostgreSQL supports range, list, hash, and composite partitioning.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Range Partitioning</h2>

          <CodeBlock
            title="SQL: Range Partitioning"
            language="sql"
            code={`-- Create partitioned table
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

CREATE TABLE orders_2024_q3 PARTITION OF orders
  FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

CREATE TABLE orders_2024_q4 PARTITION OF orders
  FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

-- Default partition (catches values outside defined ranges)
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Insert data (automatically routed to correct partition)
INSERT INTO orders (user_id, total, created_at) 
VALUES (1, 100.00, '2024-02-15');
-- Goes to orders_2024_q1

-- Query partitioned table (queries all partitions automatically)
SELECT * FROM orders WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31';
-- Only queries orders_2024_q1 (partition pruning)

-- Range partitioning with multiple columns
CREATE TABLE events (
  id SERIAL,
  event_type TEXT,
  created_at TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- View partitions
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename LIKE 'orders_%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">List Partitioning</h2>

          <CodeBlock
            title="SQL: List Partitioning"
            language="sql"
            code={`-- Create list-partitioned table
CREATE TABLE users (
  id SERIAL,
  name TEXT,
  email TEXT,
  country TEXT
) PARTITION BY LIST (country);

-- Create partitions for specific values
CREATE TABLE users_usa PARTITION OF users
  FOR VALUES IN ('US', 'USA');

CREATE TABLE users_europe PARTITION OF users
  FOR VALUES IN ('UK', 'FR', 'DE', 'IT', 'ES');

CREATE TABLE users_asia PARTITION OF users
  FOR VALUES IN ('JP', 'CN', 'IN', 'KR');

CREATE TABLE users_other PARTITION OF users DEFAULT;

-- Insert data
INSERT INTO users (name, email, country) 
VALUES ('John', 'john@example.com', 'US');
-- Goes to users_usa

INSERT INTO users (name, email, country) 
VALUES ('Pierre', 'pierre@example.com', 'FR');
-- Goes to users_europe

-- Query with partition pruning
SELECT * FROM users WHERE country = 'US';
-- Only queries users_usa partition

-- List partitioning with multiple columns
CREATE TABLE products (
  id SERIAL,
  name TEXT,
  category TEXT,
  status TEXT
) PARTITION BY LIST (category, status);

CREATE TABLE products_electronics_active PARTITION OF products
  FOR VALUES IN (('electronics', 'active'));

CREATE TABLE products_clothing_active PARTITION OF products
  FOR VALUES IN (('clothing', 'active'));`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Hash Partitioning</h2>

          <CodeBlock
            title="SQL: Hash Partitioning"
            language="sql"
            code={`-- Create hash-partitioned table
CREATE TABLE sessions (
  id SERIAL,
  user_id INTEGER,
  data JSONB,
  created_at TIMESTAMP
) PARTITION BY HASH (user_id);

-- Create hash partitions
CREATE TABLE sessions_0 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE sessions_1 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE sessions_2 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE sessions_3 PARTITION OF sessions
  FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Insert data (distributed by hash)
INSERT INTO sessions (user_id, data, created_at) 
VALUES (1, '{"key": "value"}', NOW());
-- Distributed to one of the partitions based on hash

-- Query hash-partitioned table
SELECT * FROM sessions WHERE user_id = 1;
-- Queries appropriate partition based on hash

-- Hash partitioning evenly distributes data
-- Good for: load balancing, parallel processing
-- Not good for: range queries, time-based data`}
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

-- Insert data
INSERT INTO orders (user_id, total, created_at, status) 
VALUES (1, 100.00, '2024-02-15', 'completed');
-- Goes to orders_2024_q1_completed

-- Query with partition pruning at multiple levels
SELECT * FROM orders 
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31'
  AND status = 'completed';
-- Only queries orders_2024_q1_completed

-- View all partitions including sub-partitions
SELECT 
  schemaname,
  tablename
FROM pg_tables
WHERE tablename LIKE 'orders%'
ORDER BY tablename;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Partition Pruning</h2>

          <CodeBlock
            title="SQL: Partition Pruning"
            language="sql"
            code={`-- Partition pruning (automatic optimization)
-- Query only accesses relevant partitions

-- Range partition pruning
SELECT * FROM orders 
WHERE created_at >= '2024-01-01' 
  AND created_at < '2024-04-01';
-- Only queries orders_2024_q1

-- List partition pruning
SELECT * FROM users WHERE country = 'US';
-- Only queries users_usa

-- Hash partition pruning
SELECT * FROM sessions WHERE user_id = 1;
-- Only queries relevant hash partition

-- Check if pruning is working
EXPLAIN SELECT * FROM orders 
WHERE created_at BETWEEN '2024-01-01' AND '2024-03-31';
-- Should show: Append -> Seq Scan on orders_2024_q1 only

-- Pruning with JOINs
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at >= '2024-01-01' 
  AND o.created_at < '2024-04-01';
-- Prunes orders partitions

-- Pruning with subqueries
SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders 
  WHERE created_at >= '2024-01-01'
);
-- May prune orders partitions

-- Pruning may not work with:
-- - Functions on partition key
-- - Complex expressions
-- - Some JOIN conditions`}
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
ALTER TABLE orders ATTACH PARTITION orders_old
  FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

-- Drop partition
DROP TABLE orders_2024_q1;

-- Truncate partition
TRUNCATE TABLE orders_2024_q1;

-- Index on partitioned table (created on all partitions)
CREATE INDEX idx_orders_user_id ON orders(user_id);
-- Automatically created on all partitions

-- Index on specific partition
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

-- Check partition constraints
SELECT 
  conname,
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'orders'::regclass;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Partitioning</h2>

          <CodeBlock
            title="Prisma: Working with Partitions"
            language="prisma"
            code={`// Prisma doesn't have native partitioning support
// Use raw SQL for partition management

// Create partitioned table
await prisma.$executeRaw\`
  CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
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

// Insert into partitioned table
await prisma.$executeRaw\`
  INSERT INTO orders (user_id, total, created_at)
  VALUES ($1, $2, $3)
\`, 1, 100.00, '2024-02-15';

// Query partitioned table (works normally)
const orders = await prisma.$queryRaw\`
  SELECT * FROM orders 
  WHERE created_at >= $1 AND created_at < $2
\`, '2024-01-01', '2024-04-01';

// Check partition pruning
const plan = await prisma.$queryRaw\`
  EXPLAIN SELECT * FROM orders 
  WHERE created_at >= $1 AND created_at < $2
\`, '2024-01-01', '2024-04-01';

// Add new partition
await prisma.$executeRaw\`
  CREATE TABLE orders_2025_q1 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01')
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

// Note: Prisma migrations don't support partitioning
// Use raw SQL migrations for partition setup`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use range partitioning</strong> for time-series data</li>
              <li><strong>Use list partitioning</strong> for discrete value sets</li>
              <li><strong>Use hash partitioning</strong> for even distribution</li>
              <li><strong>Keep partition size manageable</strong> - not too small or too large</li>
              <li><strong>Plan partition strategy</strong> before creating table</li>
              <li><strong>Use partition pruning</strong> - design queries to enable it</li>
              <li><strong>Create indexes</strong> on partitioned tables (applies to all partitions)</li>
              <li><strong>Monitor partition sizes</strong> and add new partitions as needed</li>
              <li><strong>Archive old partitions</strong> by detaching and moving to archive</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

