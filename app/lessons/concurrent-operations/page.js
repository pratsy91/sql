import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Concurrent Operations - PostgreSQL Learning',
  description: 'Learn about PostgreSQL concurrent operations including concurrent index creation and concurrent VACUUM',
};

export default function ConcurrentOperations() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Concurrent Operations</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What are Concurrent Operations?</h2>
          <p className="mb-4">
            Concurrent operations allow you to perform maintenance tasks like creating indexes or running VACUUM 
            without blocking normal database operations. These operations use lower-level locks that don't 
            prevent reads and writes to the table.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Concurrent Index Creation</h2>

          <CodeBlock
            title="SQL: CREATE INDEX CONCURRENTLY"
            language="sql"
            code={`-- Regular index creation (blocks writes)
CREATE INDEX idx_users_email ON users(email);
-- Table is locked during index creation

-- Concurrent index creation (doesn't block)
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
-- Table remains available for reads and writes

-- Concurrent index on large table
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
-- Can take a long time but doesn't block operations

-- Concurrent unique index
CREATE UNIQUE INDEX CONCURRENTLY idx_users_email_unique ON users(email);
-- Note: Must ensure no duplicates exist before creating

-- Concurrent partial index
CREATE INDEX CONCURRENTLY idx_active_users 
ON users(email) 
WHERE status = 'active';

-- Concurrent index with expression
CREATE INDEX CONCURRENTLY idx_users_name_lower 
ON users(LOWER(name));

-- Concurrent index on multiple columns
CREATE INDEX CONCURRENTLY idx_users_name_email 
ON users(name, email);

-- Check index creation progress
SELECT 
  pid,
  datname,
  usename,
  application_name,
  state,
  query,
  query_start,
  now() - query_start AS duration
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX CONCURRENTLY%';

-- View index creation status
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'idx_users_email';

-- Drop index concurrently (PostgreSQL 12+)
DROP INDEX CONCURRENTLY idx_users_email;

-- Note: Cannot use CONCURRENTLY in a transaction
-- This will fail:
BEGIN;
  CREATE INDEX CONCURRENTLY idx_test ON users(name);
COMMIT;
-- Error: CREATE INDEX CONCURRENTLY cannot run inside a transaction block`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Concurrent Index Best Practices</h2>

          <CodeBlock
            title="SQL: Concurrent Index Guidelines"
            language="sql"
            code={`-- When to use CONCURRENTLY
-- 1. Large tables (millions of rows)
-- 2. Production systems that can't afford downtime
-- 3. When you need to add indexes without blocking

-- When NOT to use CONCURRENTLY
-- 1. Small tables (regular CREATE INDEX is faster)
-- 2. During maintenance windows
-- 3. When you can afford brief locks

-- Concurrent index creation process:
-- Phase 1: Create index structure (INVALID)
-- Phase 2: Populate index with existing data
-- Phase 3: Mark index as valid (VALID)

-- Check if index is valid
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users';

-- View invalid indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE indexname IN (
  SELECT indexrelid::regclass::text
  FROM pg_index
  WHERE NOT indisvalid
);

-- Rebuild invalid index
DROP INDEX idx_users_email;
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Monitor index creation
SELECT 
  pid,
  now() - query_start AS duration,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE query LIKE '%CREATE INDEX CONCURRENTLY%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Concurrent VACUUM</h2>

          <CodeBlock
            title="SQL: VACUUM Operations"
            language="sql"
            code={`-- Regular VACUUM (can block some operations)
VACUUM users;
-- Takes ACCESS SHARE lock (allows reads, blocks some writes)

-- VACUUM FULL (requires exclusive lock)
VACUUM FULL users;
-- Blocks all operations on table

-- VACUUM with options
VACUUM (VERBOSE, ANALYZE) users;

-- VACUUM FREEZE (prevents transaction ID wraparound)
VACUUM FREEZE users;

-- Auto-vacuum (runs automatically)
-- Configured via autovacuum settings
SHOW autovacuum;
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_vacuum_scale_factor;

-- VACUUM runs concurrently by default
-- Uses lower-level locks that don't block reads/writes
-- But may block some DDL operations

-- Monitor VACUUM progress (PostgreSQL 13+)
SELECT 
  pid,
  datname,
  usename,
  application_name,
  state,
  query,
  query_start,
  now() - query_start AS duration
FROM pg_stat_activity
WHERE query LIKE '%VACUUM%';

-- View VACUUM statistics
SELECT 
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  vacuum_count,
  autovacuum_count,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- VACUUM all tables
VACUUM;

-- VACUUM with specific options
VACUUM (VERBOSE, ANALYZE, FREEZE) users;

-- VACUUM and reindex concurrently
-- 1. VACUUM (concurrent by default)
VACUUM ANALYZE users;
-- 2. Reindex (requires exclusive lock, use during maintenance)
REINDEX TABLE users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Other Concurrent Operations</h2>

          <CodeBlock
            title="SQL: Additional Concurrent Operations"
            language="sql"
            code={`-- ALTER TABLE ... ADD COLUMN (concurrent by default in recent versions)
ALTER TABLE users ADD COLUMN new_column TEXT;
-- Doesn't block reads/writes in PostgreSQL 11+

-- ALTER TABLE ... DROP COLUMN (requires rewrite, blocks)
ALTER TABLE users DROP COLUMN old_column;
-- Blocks operations

-- ALTER TABLE ... SET NOT NULL (requires table scan)
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
-- May take time but doesn't block reads

-- CREATE STATISTICS (concurrent)
CREATE STATISTICS user_stats ON name, email FROM users;
-- Doesn't block operations

-- ANALYZE (concurrent by default)
ANALYZE users;
-- Updates statistics without blocking

-- REINDEX CONCURRENTLY (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_users_email;
-- Rebuilds index without blocking

-- REINDEX TABLE CONCURRENTLY (PostgreSQL 12+)
REINDEX TABLE CONCURRENTLY users;
-- Rebuilds all indexes on table without blocking

-- View reindex progress
SELECT 
  pid,
  query,
  now() - query_start AS duration
FROM pg_stat_activity
WHERE query LIKE '%REINDEX%CONCURRENTLY%';

-- CLUSTER (requires exclusive lock, not concurrent)
CLUSTER users USING idx_users_email;
-- Blocks operations

-- Note: Some operations cannot be concurrent
-- - DROP TABLE (requires exclusive lock)
-- - TRUNCATE (requires exclusive lock)
-- - ALTER TABLE ... DROP COLUMN (requires rewrite)`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Monitoring Concurrent Operations</h2>

          <CodeBlock
            title="SQL: Monitoring Concurrent Operations"
            language="sql"
            code={`-- View all concurrent operations
SELECT 
  pid,
  datname,
  usename,
  state,
  wait_event_type,
  wait_event,
  query,
  query_start,
  now() - query_start AS duration
FROM pg_stat_activity
WHERE query LIKE '%CONCURRENTLY%'
   OR query LIKE '%VACUUM%'
   OR query LIKE '%ANALYZE%'
ORDER BY query_start;

-- Check for blocking operations
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocking_locks.pid AS blocking_pid,
  blocked_activity.query AS blocked_query,
  blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.relation = blocked_locks.relation
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- View lock information
SELECT 
  locktype,
  relation::regclass,
  mode,
  granted,
  pid
FROM pg_locks
WHERE relation IS NOT NULL
ORDER BY relation, mode;

-- Check index creation status
SELECT 
  i.relname AS index_name,
  a.attname AS column_name,
  ix.indisvalid AS is_valid,
  ix.indisready AS is_ready
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = ANY(ix.indkey)
WHERE i.relname LIKE 'idx_%'
ORDER BY i.relname;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Concurrent Operations</h2>

          <CodeBlock
            title="Prisma: Concurrent Operations"
            language="prisma"
            code={`// Prisma doesn't have direct support for concurrent operations
// Use raw SQL for concurrent index creation

// Create index concurrently
await prisma.$executeRaw\`
  CREATE INDEX CONCURRENTLY idx_users_email ON users(email)
\`;

// Monitor index creation
const indexStatus = await prisma.$queryRaw\`
  SELECT 
    indexname,
    indexdef
  FROM pg_indexes
  WHERE indexname = 'idx_users_email'
\`;

// Drop index concurrently (PostgreSQL 12+)
await prisma.$executeRaw\`
  DROP INDEX CONCURRENTLY idx_users_email
\`;

// VACUUM (concurrent by default)
await prisma.$executeRaw\`
  VACUUM ANALYZE users
\`;

// Check VACUUM statistics
const vacuumStats = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    n_dead_tup,
    n_live_tup
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
\`;

// REINDEX CONCURRENTLY (PostgreSQL 12+)
await prisma.$executeRaw\`
  REINDEX INDEX CONCURRENTLY idx_users_email
\`;

// Monitor concurrent operations
const operations = await prisma.$queryRaw\`
  SELECT 
    pid,
    query,
    state,
    now() - query_start AS duration
  FROM pg_stat_activity
  WHERE query LIKE '%CONCURRENTLY%'
     OR query LIKE '%VACUUM%'
  ORDER BY query_start
\`;

// For schema migrations with Prisma
// Use prisma migrate but be aware of locking
// For large tables, consider:
// 1. Create index concurrently manually
// 2. Then mark as created in migration

// Example: Add index in production
await prisma.$executeRaw\`
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at 
  ON users(created_at)
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Use CONCURRENTLY</strong> for indexes on large tables in production</li>
              <li><strong>Monitor index creation</strong> progress for long-running operations</li>
              <li><strong>Check for invalid indexes</strong> after concurrent creation</li>
              <li><strong>Use VACUUM regularly</strong> - it's concurrent by default</li>
              <li><strong>Configure autovacuum</strong> appropriately for your workload</li>
              <li><strong>Use REINDEX CONCURRENTLY</strong> to rebuild indexes without blocking</li>
              <li><strong>Plan maintenance windows</strong> for operations that can't be concurrent</li>
              <li><strong>Monitor blocking operations</strong> during concurrent maintenance</li>
              <li><strong>Test concurrent operations</strong> in staging before production</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

