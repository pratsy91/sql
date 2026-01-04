import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Maintenance Tasks - PostgreSQL Learning',
  description: 'Learn about PostgreSQL maintenance tasks including regular maintenance operations',
};

export default function MaintenanceTasks() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Maintenance Tasks</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">VACUUM Operations</h2>

          <CodeBlock
            title="SQL: VACUUM Operations"
            language="sql"
            code={`-- VACUUM - Reclaim storage and update statistics
VACUUM;

-- VACUUM specific table
VACUUM users;

-- VACUUM ANALYZE - VACUUM and update statistics
VACUUM ANALYZE users;

-- VACUUM FULL - Reclaim all space (locks table)
VACUUM FULL users;

-- VACUUM VERBOSE - Show detailed information
VACUUM VERBOSE users;

-- VACUUM FREEZE - Freeze old transaction IDs
VACUUM FREEZE users;

-- Check table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  n_dead_tup,
  n_live_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check when autovacuum last ran
SELECT 
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY last_autovacuum DESC NULLS LAST;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">ANALYZE Operations</h2>

          <CodeBlock
            title="SQL: ANALYZE Operations"
            language="sql"
            code={`-- ANALYZE - Update table statistics
ANALYZE;

-- ANALYZE specific table
ANALYZE users;

-- ANALYZE VERBOSE - Show detailed information
ANALYZE VERBOSE users;

-- ANALYZE specific columns
ANALYZE users (email, name);

-- Check statistics
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY attname;

-- View statistics target
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Set statistics target for column
ALTER TABLE users ALTER COLUMN email SET STATISTICS 1000;

-- View current statistics target
SELECT 
  attname,
  attstattarget
FROM pg_attribute
WHERE attrelid = 'users'::regclass
  AND attnum > 0;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">REINDEX Operations</h2>

          <CodeBlock
            title="SQL: REINDEX Operations"
            language="sql"
            code={`-- REINDEX - Rebuild indexes
REINDEX TABLE users;

-- REINDEX specific index
REINDEX INDEX idx_users_email;

-- REINDEX DATABASE - Rebuild all indexes in database
REINDEX DATABASE mydb;

-- REINDEX SCHEMA - Rebuild all indexes in schema
REINDEX SCHEMA public;

-- REINDEX CONCURRENTLY - Rebuild without locking (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_users_email;
REINDEX TABLE CONCURRENTLY users;

-- Check index bloat
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find duplicate indexes
SELECT 
  a.schemaname,
  a.tablename,
  a.indexname AS index_a,
  b.indexname AS index_b,
  a.indexdef AS definition_a,
  b.indexdef AS definition_b
FROM pg_indexes a
JOIN pg_indexes b ON a.tablename = b.tablename
WHERE a.indexname < b.indexname
  AND a.indexdef = b.indexdef
  AND a.schemaname = 'public';`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Regular Maintenance Schedule</h2>

          <CodeBlock
            title="SQL: Maintenance Schedule"
            language="sql"
            code={`-- Daily maintenance tasks:
-- 1. Monitor autovacuum
SELECT 
  schemaname,
  tablename,
  last_autovacuum,
  n_dead_tup,
  n_live_tup,
  CASE 
    WHEN n_live_tup > 0 
    THEN ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
    ELSE 0
  END AS dead_tuple_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY dead_tuple_percent DESC;

-- 2. Check for long-running queries
SELECT 
  pid,
  now() - query_start AS duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 minutes';

-- 3. Monitor database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) AS database_size;

-- Weekly maintenance tasks:
-- 1. VACUUM ANALYZE all tables
VACUUM ANALYZE;

-- 2. Check for unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 3. Check table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Monthly maintenance tasks:
-- 1. REINDEX large indexes
REINDEX INDEX CONCURRENTLY idx_large_table_column;

-- 2. Update statistics targets
ALTER TABLE large_table ALTER COLUMN important_column SET STATISTICS 1000;

-- 3. Check for table growth
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Autovacuum Configuration</h2>

          <CodeBlock
            title="SQL: Autovacuum Configuration"
            language="sql"
            code={`-- View autovacuum settings
SELECT name, setting, unit, context
FROM pg_settings
WHERE name LIKE 'autovacuum%'
ORDER BY name;

-- Key autovacuum settings:
-- autovacuum = on
-- autovacuum_max_workers = 3
-- autovacuum_naptime = 1min
-- autovacuum_vacuum_threshold = 50
-- autovacuum_vacuum_scale_factor = 0.2
-- autovacuum_analyze_threshold = 50
-- autovacuum_analyze_scale_factor = 0.1
-- autovacuum_vacuum_cost_delay = 20ms
-- autovacuum_vacuum_cost_limit = -1

-- Table-specific autovacuum settings
ALTER TABLE users SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Disable autovacuum for specific table
ALTER TABLE temp_table SET (autovacuum_enabled = false);

-- View table-specific autovacuum settings
SELECT 
  relname,
  reloptions
FROM pg_class
WHERE relname = 'users';

-- Check autovacuum activity
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
WHERE schemaname = 'public'
ORDER BY last_autovacuum DESC NULLS LAST;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Maintenance Tasks</h2>

          <CodeBlock
            title="Prisma: Maintenance Operations"
            language="prisma"
            code={`// Run maintenance tasks using raw SQL

// VACUUM ANALYZE
await prisma.$executeRaw\`VACUUM ANALYZE\`;

// VACUUM specific table
await prisma.$executeRaw\`VACUUM ANALYZE "User"\`;

// Check table bloat
const tableBloat = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    n_dead_tup,
    n_live_tup,
    last_vacuum,
    last_autovacuum
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
\`;

// REINDEX
await prisma.$executeRaw\`REINDEX TABLE CONCURRENTLY "User"\`;

// Check index bloat
const indexBloat = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY pg_relation_size(indexrelid) DESC
\`;

// Find unused indexes
const unusedIndexes = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
    AND schemaname = 'public'
  ORDER BY pg_relation_size(indexrelid) DESC
\`;

// Check autovacuum status
const autovacuumStatus = await prisma.$queryRaw\`
  SELECT 
    schemaname,
    tablename,
    last_autovacuum,
    n_dead_tup,
    n_live_tup
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY last_autovacuum DESC NULLS LAST
\`;

// Monitor database size
const dbSize = await prisma.$queryRaw\`
  SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size
\`;

// Schedule maintenance (use cron or similar)
// Example: Run VACUUM ANALYZE daily
// 0 2 * * * psql -d mydb -c "VACUUM ANALYZE;"`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Let autovacuum run</strong> - it handles most maintenance automatically</li>
              <li><strong>Monitor autovacuum</strong> - ensure it's running effectively</li>
              <li><strong>Use VACUUM ANALYZE</strong> - regularly for optimal performance</li>
              <li><strong>Use REINDEX CONCURRENTLY</strong> - for production indexes</li>
              <li><strong>Monitor table bloat</strong> - identify tables needing VACUUM</li>
              <li><strong>Remove unused indexes</strong> - free up space and improve writes</li>
              <li><strong>Schedule maintenance</strong> - during low-traffic periods</li>
              <li><strong>Test maintenance scripts</strong> - before running in production</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

