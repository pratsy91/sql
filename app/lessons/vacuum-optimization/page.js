import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'VACUUM Optimization - PostgreSQL Learning',
  description: 'Learn about PostgreSQL VACUUM including VACUUM, VACUUM FULL, VACUUM ANALYZE, and autovacuum configuration',
};

export default function VACUUMOptimization() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">VACUUM Optimization</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">What is VACUUM?</h2>
          <p className="mb-4">
            VACUUM reclaims storage occupied by dead tuples (deleted or updated rows) and updates 
            table statistics. It's essential for maintaining database performance and preventing 
            transaction ID wraparound. PostgreSQL runs autovacuum automatically, but manual VACUUM 
            may be needed for optimization.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">VACUUM</h2>

          <CodeBlock
            title="SQL: Basic VACUUM"
            language="sql"
            code={`-- Basic VACUUM (removes dead tuples)
VACUUM users;

-- VACUUM all tables
VACUUM;

-- VACUUM with verbose output
VACUUM VERBOSE users;

-- VACUUM specific columns
VACUUM users (name, email);

-- VACUUM doesn't require exclusive lock
-- Can run concurrently with normal operations
-- Uses ACCESS SHARE lock (allows reads/writes)

-- Check VACUUM progress (PostgreSQL 13+)
SELECT 
  pid,
  datname,
  usename,
  query,
  state,
  wait_event_type,
  wait_event
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

-- VACUUM options
VACUUM (VERBOSE) users;
VACUUM (FULL) users;  -- VACUUM FULL (see below)
VACUUM (FREEZE) users;
VACUUM (ANALYZE) users;  -- Also runs ANALYZE
VACUUM (DISABLE_PAGE_SKIPPING) users;
VACUUM (SKIP_LOCKED) users;
VACUUM (INDEX_CLEANUP) users;
VACUUM (TRUNCATE) users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">VACUUM FULL</h2>

          <CodeBlock
            title="SQL: VACUUM FULL"
            language="sql"
            code={`-- VACUUM FULL (rewrites table, requires exclusive lock)
VACUUM FULL users;

-- VACUUM FULL reclaims disk space
-- Regular VACUUM doesn't return space to OS
-- VACUUM FULL does return space to OS

-- VACUUM FULL is expensive
-- Requires ACCESS EXCLUSIVE lock (blocks all operations)
-- Rewrites entire table
-- Use only when necessary

-- When to use VACUUM FULL:
-- 1. Significant table bloat (>50% dead tuples)
-- 2. After large DELETE operations
-- 3. During maintenance windows

-- Check table bloat before VACUUM FULL
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  n_dead_tup,
  n_live_tup,
  ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_pct DESC;

-- VACUUM FULL with options
VACUUM (FULL, VERBOSE) users;
VACUUM (FULL, FREEZE) users;

-- Alternative: CLUSTER (also requires exclusive lock)
CLUSTER users USING users_pkey;
-- Reorganizes table based on index`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">VACUUM ANALYZE</h2>

          <CodeBlock
            title="SQL: VACUUM ANALYZE"
            language="sql"
            code={`-- VACUUM ANALYZE (VACUUM + ANALYZE in one command)
VACUUM ANALYZE users;

-- More efficient than running separately
-- Updates both dead tuples and statistics

-- VACUUM ANALYZE all tables
VACUUM ANALYZE;

-- VACUUM ANALYZE with verbose
VACUUM (ANALYZE, VERBOSE) users;

-- Check last VACUUM and ANALYZE
SELECT 
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  vacuum_count,
  autovacuum_count,
  analyze_count,
  autoanalyze_count
FROM pg_stat_user_tables
WHERE tablename = 'users';

-- VACUUM ANALYZE is recommended after:
-- 1. Large data loads
-- 2. Bulk updates
-- 3. Large deletes
-- 4. Schema changes

-- Combined with other options
VACUUM (ANALYZE, VERBOSE, FREEZE) users;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Autovacuum</h2>

          <CodeBlock
            title="SQL: Autovacuum Configuration"
            language="sql"
            code={`-- Check autovacuum settings
SHOW autovacuum;
SHOW autovacuum_vacuum_threshold;
SHOW autovacuum_vacuum_scale_factor;
SHOW autovacuum_analyze_threshold;
SHOW autovacuum_analyze_scale_factor;
SHOW autovacuum_vacuum_cost_delay;
SHOW autovacuum_vacuum_cost_limit;

-- Default settings:
-- autovacuum_vacuum_threshold = 50
-- autovacuum_vacuum_scale_factor = 0.2 (20%)
-- autovacuum_analyze_threshold = 50
-- autovacuum_analyze_scale_factor = 0.1 (10%)

-- Autovacuum triggers when:
-- n_dead_tup > vacuum_threshold + vacuum_scale_factor * n_live_tup

-- Configure autovacuum globally
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;

-- Configure autovacuum per table
ALTER TABLE users SET (
  autovacuum_vacuum_threshold = 100,
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_threshold = 100,
  autovacuum_analyze_scale_factor = 0.05
);

-- Disable autovacuum for a table (not recommended)
ALTER TABLE users SET (autovacuum_enabled = false);

-- Re-enable autovacuum
ALTER TABLE users SET (autovacuum_enabled = true);

-- View autovacuum activity
SELECT 
  schemaname,
  tablename,
  last_autovacuum,
  last_autoanalyze,
  autovacuum_count,
  autoanalyze_count,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum NULLS LAST;

-- Check autovacuum workers
SELECT 
  pid,
  datname,
  usename,
  state,
  query,
  query_start
FROM pg_stat_activity
WHERE query LIKE '%autovacuum%';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">VACUUM FREEZE</h2>

          <CodeBlock
            title="SQL: VACUUM FREEZE"
            language="sql"
            code={`-- VACUUM FREEZE (prevents transaction ID wraparound)
VACUUM FREEZE users;

-- Marks old tuples as frozen
-- Prevents transaction ID wraparound issues
-- Important for long-running databases

-- Check transaction age
SELECT 
  datname,
  age(datfrozenxid) AS oldest_transaction_age
FROM pg_database
WHERE datname = current_database();

-- Check per-table transaction age
SELECT 
  schemaname,
  tablename,
  age(relfrozenxid) AS frozen_xid_age
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY age(relfrozenxid) DESC;

-- VACUUM FREEZE all tables
VACUUM FREEZE;

-- VACUUM FREEZE with analyze
VACUUM (FREEZE, ANALYZE) users;

-- Autovacuum runs FREEZE automatically
-- When age(relfrozenxid) > autovacuum_freeze_max_age
-- Default: 200 million transactions

-- Monitor freeze activity
SELECT 
  schemaname,
  tablename,
  n_dead_tup,
  last_autovacuum,
  age(relfrozenxid) AS frozen_age
FROM pg_stat_user_tables s
JOIN pg_class c ON c.relname = s.tablename
WHERE age(relfrozenxid) > 100000000
ORDER BY age(relfrozenxid) DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: VACUUM</h2>

          <CodeBlock
            title="Prisma: VACUUM Operations"
            language="prisma"
            code={`// Prisma doesn't have direct VACUUM support
// Use raw SQL for VACUUM operations

// Basic VACUUM
await prisma.$executeRaw\`VACUUM "User"\`;

// VACUUM ANALYZE
await prisma.$executeRaw\`VACUUM ANALYZE "User"\`;

// VACUUM all tables
await prisma.$executeRaw\`VACUUM\`;

// VACUUM FULL (use with caution)
await prisma.$executeRaw\`VACUUM FULL "User"\`;

// Check VACUUM statistics
const vacuumStats = await prisma.$queryRaw\`
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
  WHERE schemaname = 'public'
\`;

// Check table bloat
const bloat = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    n_dead_tup,
    n_live_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND n_dead_tup > 0
  ORDER BY dead_pct DESC
\`;

// Configure autovacuum per table
await prisma.$executeRaw\`
  ALTER TABLE "User" SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
  )
\`;

// Check autovacuum settings
const autovacuumSettings = await prisma.$queryRaw\`
  SELECT 
    name,
    setting,
    unit
  FROM pg_settings
  WHERE name LIKE 'autovacuum%'
  ORDER BY name
\`;

// Monitor autovacuum activity
const autovacuumActivity = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    last_autovacuum,
    autovacuum_count,
    n_dead_tup
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY last_autovacuum DESC
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Let autovacuum run</strong> - it handles most cases automatically</li>
              <li><strong>Monitor dead tuple counts</strong> - high counts indicate need for VACUUM</li>
              <li><strong>Use VACUUM ANALYZE</strong> after bulk operations</li>
              <li><strong>Use VACUUM FULL sparingly</strong> - only when significant bloat exists</li>
              <li><strong>Configure autovacuum</strong> for high-update tables</li>
              <li><strong>Monitor transaction age</strong> to prevent wraparound</li>
              <li><strong>Schedule VACUUM</strong> during low-activity periods if needed</li>
              <li><strong>Check VACUUM effectiveness</strong> by monitoring dead tuple reduction</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

