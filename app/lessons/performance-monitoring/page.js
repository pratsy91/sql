import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';

export const metadata = {
  title: 'Performance Monitoring - PostgreSQL Learning',
  description: 'Learn about PostgreSQL performance monitoring including pg_stat_statements and pg_stat_activity',
};

export default function PerformanceMonitoring() {
  return (
    <LessonLayout>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold mb-6">Performance Monitoring</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_stat_statements</h2>

          <CodeBlock
            title="SQL: pg_stat_statements Setup"
            language="sql"
            code={`-- Enable pg_stat_statements extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configure in postgresql.conf:
-- shared_preload_libraries = 'pg_stat_statements'
-- pg_stat_statements.max = 10000
-- pg_stat_statements.track = all

-- View top queries by execution time
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- View top queries by calls
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 10;

-- View queries with highest I/O
SELECT 
  query,
  calls,
  shared_blks_read,
  shared_blks_written,
  temp_blks_read,
  temp_blks_written
FROM pg_stat_statements
ORDER BY (shared_blks_read + shared_blks_written) DESC
LIMIT 10;

-- Find slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- More than 1 second
ORDER BY mean_exec_time DESC;

-- View query statistics by database
SELECT 
  datname,
  query,
  calls,
  total_exec_time,
  mean_exec_time
FROM pg_stat_statements
JOIN pg_database ON datname = current_database()
ORDER BY total_exec_time DESC
LIMIT 10;

-- Reset statistics
SELECT pg_stat_statements_reset();

-- View normalized queries (without parameters)
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%SELECT%'
ORDER BY total_exec_time DESC;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">pg_stat_activity</h2>

          <CodeBlock
            title="SQL: pg_stat_activity"
            language="sql"
            code={`-- View all active connections
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change,
  wait_event_type,
  wait_event,
  query
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY query_start;

-- View active queries
SELECT 
  pid,
  usename,
  application_name,
  state,
  query_start,
  now() - query_start AS query_duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND datname = current_database()
ORDER BY query_start;

-- View idle in transaction
SELECT 
  pid,
  usename,
  application_name,
  state,
  xact_start,
  now() - xact_start AS transaction_duration,
  query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND datname = current_database()
ORDER BY xact_start;

-- View blocking queries
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_query,
  blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- View connection count by application
SELECT 
  application_name,
  COUNT(*) AS connection_count,
  COUNT(*) FILTER (WHERE state = 'active') AS active_count,
  COUNT(*) FILTER (WHERE state = 'idle') AS idle_count
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY application_name
ORDER BY connection_count DESC;

-- View long-running queries
SELECT 
  pid,
  usename,
  application_name,
  state,
  now() - query_start AS query_duration,
  query
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - query_start > interval '5 minutes'
  AND datname = current_database()
ORDER BY query_start;

-- Terminate a query
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = 12345;  -- Replace with actual PID

-- Cancel a query
SELECT pg_cancel_backend(pid)
FROM pg_stat_activity
WHERE pid = 12345;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Other Statistics Views</h2>

          <CodeBlock
            title="SQL: Additional Statistics Views"
            language="sql"
            code={`-- pg_stat_database - Database-level statistics
SELECT 
  datname,
  numbackends,
  xact_commit,
  xact_rollback,
  blks_read,
  blks_hit,
  tup_returned,
  tup_fetched,
  tup_inserted,
  tup_updated,
  tup_deleted,
  conflicts,
  temp_files,
  temp_bytes,
  deadlocks
FROM pg_stat_database
WHERE datname = current_database();

-- pg_stat_user_tables - Table statistics
SELECT 
  schemaname,
  relname,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- pg_stat_user_indexes - Index statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find unused indexes
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

-- pg_stat_bgwriter - Background writer statistics
SELECT 
  checkpoints_timed,
  checkpoints_req,
  checkpoint_write_time,
  checkpoint_sync_time,
  buffers_checkpoint,
  buffers_clean,
  maxwritten_clean,
  buffers_backend,
  buffers_backend_fsync,
  buffers_alloc
FROM pg_stat_bgwriter;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prisma: Performance Monitoring</h2>

          <CodeBlock
            title="Prisma: Monitoring Queries"
            language="prisma"
            code={`// Query performance statistics using raw SQL

// Top queries by execution time
const topQueries = await prisma.$queryRaw\`
  SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
  FROM pg_stat_statements
  ORDER BY total_exec_time DESC
  LIMIT 10
\`;

// Active connections
const activeConnections = await prisma.$queryRaw\`
  SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    now() - query_start AS query_duration,
    query
  FROM pg_stat_activity
  WHERE state = 'active'
    AND datname = current_database()
  ORDER BY query_start
\`;

// Long-running queries
const longQueries = await prisma.$queryRaw\`
  SELECT 
    pid,
    usename,
    application_name,
    state,
    now() - query_start AS query_duration,
    query
  FROM pg_stat_activity
  WHERE state != 'idle'
    AND now() - query_start > interval '5 minutes'
    AND datname = current_database()
  ORDER BY query_start
\`;

// Table statistics
const tableStats = await prisma.$queryRaw\`
  SELECT 
    relname,
    seq_scan,
    idx_scan,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_analyze
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY seq_scan DESC
\`;

// Index statistics
const indexStats = await prisma.$queryRaw\`
  SELECT 
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC
\`;

// Unused indexes
const unusedIndexes = await prisma.$queryRaw\`
  SELECT 
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
  FROM pg_stat_user_indexes
  WHERE idx_scan = 0
    AND schemaname = 'public'
  ORDER BY pg_relation_size(indexrelid) DESC
\`;

// Database statistics
const dbStats = await prisma.$queryRaw\`
  SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit
  FROM pg_stat_database
  WHERE datname = current_database()
\`;`}
          />
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Enable pg_stat_statements</strong> - essential for query monitoring</li>
              <li><strong>Monitor regularly</strong> - identify performance issues early</li>
              <li><strong>Track slow queries</strong> - queries taking more than threshold</li>
              <li><strong>Monitor connections</strong> - prevent connection exhaustion</li>
              <li><strong>Check blocking queries</strong> - identify deadlocks and locks</li>
              <li><strong>Review index usage</strong> - remove unused indexes</li>
              <li><strong>Monitor table statistics</strong> - track growth and activity</li>
              <li><strong>Set up alerts</strong> - for critical metrics</li>
            </ul>
          </div>
        </section>
      </div>
    </LessonLayout>
  );
}

